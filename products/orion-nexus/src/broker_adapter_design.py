"""Broker adapter interface design (skeleton, no live credentials)."""

from __future__ import annotations
from dataclasses import dataclass

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
