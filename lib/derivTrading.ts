// @ts-nocheck

const APP_ID = '1089';
const WEBSOCKET_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export class DerivTrading {
    private connection: WebSocket;
    private isReady: boolean = false;
    private connectionPromise: Promise<void>;
    private authorizationToken: string | null = null;

    constructor() {
        this.connection = new WebSocket(WEBSOCKET_URL);
        
        this.connectionPromise = new Promise((resolve) => {
            this.connection.onopen = () => {
                console.log('✅ Trading WebSocket connected');
                this.isReady = true;
                resolve();
            };

            this.connection.onerror = (error) => {
                console.error('❌ Trading WebSocket error:', error);
                resolve();
            };
        });
    }

    private async waitForConnection() {
        if (!this.isReady) {
            await this.connectionPromise;
        }
    }

    // Authorize with Deriv token
    async authorize(token: string) {
        await this.waitForConnection();
        
        return new Promise((resolve, reject) => {
            this.connection.send(JSON.stringify({
                authorize: token
            }));

            this.connection.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.msg_type === 'authorize') {
                        if (response.error) {
                            reject(response.error);
                        } else {
                            this.authorizationToken = token;
                            console.log('✅ Authorized successfully');
                            resolve(response);
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
        });
    }

    // Get a price proposal for a trade
    async getProposal(symbol: string, amount: number, duration: number, contractType: 'CALL' | 'PUT') {
        await this.waitForConnection();

        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(2);
            
            this.connection.send(JSON.stringify({
                proposal: 1,
                amount: amount,
                symbol: symbol,
                duration: duration,
                duration_unit: 's',
                contract_type: contractType,
                basis: 'stake',
                currency: 'USD',
                req_id: requestId
            }));

            this.connection.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.req_id === requestId) {
                        if (response.error) {
                            reject(response.error);
                        } else if (response.msg_type === 'proposal') {
                            resolve(response);
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
        });
    }

    // Buy a contract
    async buyContract(proposalId: string, price: number) {
        await this.waitForConnection();

        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(2);
            
            this.connection.send(JSON.stringify({
                buy: proposalId,
                price: price,
                req_id: requestId
            }));

            this.connection.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.req_id === requestId) {
                        if (response.error) {
                            reject(response.error);
                        } else if (response.msg_type === 'buy') {
                            resolve(response);
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
        });
    }

    // Get contract details (to check result)
    async getContractDetails(contractId: string) {
        await this.waitForConnection();

        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(2);
            
            this.connection.send(JSON.stringify({
                proposal_open_contract: 1,
                contract_id: contractId,
                req_id: requestId
            }));

            this.connection.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.req_id === requestId) {
                        if (response.error) {
                            reject(response.error);
                        } else {
                            resolve(response);
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
        });
    }

    // Execute a full trade (Rise or Fall)
    async executeTrade(
        symbol: string,
        amount: number,
        duration: number,
        contractType: 'CALL' | 'PUT'
    ) {
        try {
            // Step 1: Get a proposal
            const proposal: any = await this.getProposal(symbol, amount, duration, contractType);
            const proposalId = proposal.proposal.id;
            const price = proposal.proposal.ask_price;

            console.log(`📊 Proposal received: ${proposalId}, Price: ${price}`);

            // Step 2: Buy the contract
            const buyResult: any = await this.buyContract(proposalId, price);
            const contractId = buyResult.buy.contract_id;

            console.log(`🛒 Contract bought: ${contractId}`);

            // Step 3: Wait for contract to complete
            // The contract will auto-complete after the duration
            // We need to check the result after the duration + some buffer time
            const waitTime = duration * 1000 + 2000; // duration in seconds + 2 seconds buffer
            console.log(`⏳ Waiting ${waitTime}ms for contract to complete...`);

            return new Promise((resolve) => {
                setTimeout(async () => {
                    try {
                        // Step 4: Get the contract result
                        const result: any = await this.getContractDetails(contractId);
                        console.log('📈 Contract result:', result);
                        resolve(result);
                    } catch (error) {
                        console.error('Error getting contract result:', error);
                        resolve({ error: 'Failed to get result' });
                    }
                }, waitTime);
            });

        } catch (error) {
            console.error('Trade execution error:', error);
            throw error;
        }
    }

    // Close connection
    close() {
        if (this.connection.readyState === WebSocket.OPEN) {
            this.connection.close();
        }
    }
}