"""Broker adapter interface design + paper-trading payload builder (safe, no live credentials)."""

from __future__ import annotations

from dataclasses import dataclass, asdict
import datetime as dt


@dataclass
class OrderRequest:
    symbol: str
    side: str   # buy/sell
    qty: float
    order_type: str = "market"
    tif: str = "day"


class RiskGate:
    def __init__(self, max_position_pct: float = 0.2, max_daily_loss_pct: float = 0.02):
        self.max_position_pct = max_position_pct
        self.max_daily_loss_pct = max_daily_loss_pct

    def pre_trade_check(self, equity: float, symbol_position_value: float, order_value: float, today_pnl_pct: float) -> tuple[bool, str]:
        if today_pnl_pct <= -self.max_daily_loss_pct:
            return False, "daily loss limit hit"
        if (symbol_position_value + order_value) / max(equity, 1e-9) > self.max_position_pct:
            return False, "position limit exceeded"
        return True, "ok"


class BrokerAdapter:
    def get_account(self):
        raise NotImplementedError

    def get_positions(self):
        raise NotImplementedError

    def place_order(self, req: OrderRequest):
        raise NotImplementedError

    def cancel_order(self, order_id: str):
        raise NotImplementedError


class AlpacaAdapter(BrokerAdapter):
    pass


class IBKRAdapter(BrokerAdapter):
    pass


class TradierAdapter(BrokerAdapter):
    pass


def _strategy_side(strategy_name: str) -> str:
    # Mean-reversion strategy may issue short signals in research; for conservative paper prep default to buy-only.
    if "MeanRev" in strategy_name:
        return "buy"
    return "buy"


def build_paper_trade_plan(backtest_payload: dict, symbol: str, prefer_strategy: str | None = None) -> dict:
    """Create broker-neutral paper trade payload from backtest result.

    No live API calls; output is for dry-run integration tests.
    """
    results = backtest_payload.get("results", [])
    if not results:
        raise ValueError("backtest payload has no strategy results")

    selected = None
    if prefer_strategy:
        for r in results:
            if r.get("strategy") == prefer_strategy:
                selected = r
                break
    if selected is None:
        selected = sorted(results, key=lambda x: x.get("score", 0), reverse=True)[0]

    # conservative default book for paper simulation
    equity = 100000.0
    symbol_position_value = 0.0
    target_position_pct = 0.1
    order_value = equity * target_position_pct
    ref_price = 100.0  # placeholder; real adapter should read latest quote
    qty = round(order_value / ref_price, 2)

    gate = RiskGate(max_position_pct=0.2, max_daily_loss_pct=0.02)
    ok, reason = gate.pre_trade_check(
        equity=equity,
        symbol_position_value=symbol_position_value,
        order_value=order_value,
        today_pnl_pct=0.0,
    )

    req = OrderRequest(
        symbol=symbol,
        side=_strategy_side(selected["strategy"]),
        qty=qty,
        order_type="market",
        tif="day",
    )

    return {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "mode": "paper",
        "symbol": symbol,
        "selected_strategy": {
            "name": selected.get("strategy"),
            "score": selected.get("score"),
            "sharpe": selected.get("sharpe"),
            "max_drawdown": selected.get("max_drawdown"),
        },
        "risk_gate": {
            "max_position_pct": gate.max_position_pct,
            "max_daily_loss_pct": gate.max_daily_loss_pct,
            "check": {"pass": ok, "reason": reason},
        },
        "paper_order_request": asdict(req),
        "notes": [
            "paper-only payload; do NOT submit to live account directly",
            "replace ref_price with broker quote before production",
            "keep human approval for any live trading migration",
        ],
    }
