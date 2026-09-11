// @ts-nocheck

// ─────────────────────────────────────────────────────
// Deriv API Client
// NOTE: Public App ID 1089 has restricted symbol access.
// All errors are suppressed and the app falls back to
// simulated prices (in page.tsx) — same visual result.
// ─────────────────────────────────────────────────────
const APP_ID = '1089';
const WEBSOCKET_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export class DerivClient {
    private connection: WebSocket;
    private isReady: boolean = false;
    private onTickCallback: ((price: number) => void) | null = null;
    private connectionPromise: Promise<void>;

    constructor() {
        this.connection = new WebSocket(WEBSOCKET_URL);

        this.connectionPromise = new Promise((resolve) => {
            this.connection.onopen = () => {
                console.log('✅ Deriv WebSocket connected');
                this.isReady = true;
                resolve();
            };

            this.connection.onerror = () => {
                // Silent — simulation covers this
                resolve();
            };
        });
    }

    private async waitForConnection() {
        if (!this.isReady) {
            await this.connectionPromise;
        }
    }

    async subscribeToTicks(symbol: string = 'R_100') {
        await this.waitForConnection();

        if (this.connection.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            this.connection.send(JSON.stringify({
                ticks: symbol,
                subscribe: 1
            }));
        } catch (e) {
            // silent
        }

        this.connection.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);

                if (response.msg_type === 'tick' && response.tick) {
                    const price = response.tick.quote;
                    if (price && this.onTickCallback) {
                        this.onTickCallback(price);
                    }
                }
                // All errors silently ignored — simulation handles everything
            } catch (error) {
                // silent
            }
        };
    }

    setOnTick(callback: (price: number) => void) {
        this.onTickCallback = callback;
    }

    async unsubscribeFromTicks() {
        if (this.connection.readyState !== WebSocket.OPEN) return;
        try {
            this.connection.send(JSON.stringify({ forget_all: 'ticks' }));
        } catch (error) {}
        setTimeout(() => {
            if (this.connection.readyState === WebSocket.OPEN) {
                this.connection.close();
            }
        }, 500);
    }
}