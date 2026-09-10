// @ts-nocheck

// Use test App ID 1089 for development
const APP_ID = '1089';
const WEBSOCKET_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export class DerivClient {
    private connection: WebSocket;
    private isReady: boolean = false;
    private onTickCallback: ((price: number) => void) | null = null;
    private connectionPromise: Promise<void>;

    constructor() {
        this.connection = new WebSocket(WEBSOCKET_URL);
        
        // Create a promise that resolves when connection is ready
        this.connectionPromise = new Promise((resolve) => {
            this.connection.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isReady = true;
                resolve();
            };

            this.connection.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                resolve(); // Resolve anyway to avoid hanging
            };
        });
    }

    // Wait for connection to be ready
    private async waitForConnection() {
        if (!this.isReady) {
            await this.connectionPromise;
        }
    }

    // Subscribe to real-time ticks for a specific symbol
    async subscribeToTicks(symbol: string = 'R_100') {
        // Wait for connection to be ready
        await this.waitForConnection();

        // Send the subscription request
        this.connection.send(JSON.stringify({
            ticks: symbol,
            subscribe: 1
        }));

        // Listen for messages
        this.connection.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                
                // Check different response formats
                if (response.msg_type === 'tick' && response.tick) {
                    const price = response.tick.quote || response.tick.price;
                    if (price) {
                        console.log('Live Price Update:', price);
                        if (this.onTickCallback) {
                            this.onTickCallback(price);
                        }
                    }
                } else if (response.msg_type === 'tick' && response.tick_data) {
                    // Some Deriv responses use tick_data
                    const price = response.tick_data.quote || response.tick_data.price;
                    if (price) {
                        console.log('Live Price Update:', price);
                        if (this.onTickCallback) {
                            this.onTickCallback(price);
                        }
                    }
                } else if (response.error) {
                    console.error('Deriv API Error:', response.error);
                }
            } catch (error) {
                console.error('Error parsing tick data:', error);
            }
        };
    }

    setOnTick(callback: (price: number) => void) {
        this.onTickCallback = callback;
    }

    // Unsubscribe from ticks
    async unsubscribeFromTicks() {
        await this.waitForConnection();
        
        try {
            this.connection.send(JSON.stringify({
                unsubscribe: 1,
                ticks: 'R_100'
            }));
        } catch (error) {
            console.log('Error unsubscribing:', error);
        }
        
        // Close connection after a short delay
        setTimeout(() => {
            if (this.connection.readyState === WebSocket.OPEN) {
                this.connection.close();
            }
        }, 500);
    }
}