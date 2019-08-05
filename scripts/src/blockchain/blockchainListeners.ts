import {Server} from "@kinecosystem/kin-sdk";
import {Address} from "..";
import {OnPaymentListener, PaymentListener, PaymentTransaction} from "./horizonModels";
import {TransactionRetriever} from "./transactionRetriever";
import {Utils} from "../utils";

export class BlockchainListener {

	constructor(private readonly _server: Server) {
		this._server = _server;
	}

	public createPaymentsListener(onPayment: OnPaymentListener, addresses: Address[]): PaymentListener {
		return new MultiAccountsListener(this._server, onPayment, addresses);
	}
}

class MultiAccountsListener implements PaymentListener {

	private readonly _addresses: Set<Address> = new Set<Address>();
	private readonly _stream: any;

	constructor(server: Server, private readonly _onPayment: OnPaymentListener, addresses: Address[]) {
		if (addresses) {
			for (const address of addresses) {
				Utils.verifyValidAddressParam(address);
				this._addresses.add(address);
			}
		}
		this._stream = server.transactions().cursor("now").stream({
			onmessage: (txRecord: Server.TransactionRecord) => {
				const payment = TransactionRetriever.fromStellarTransaction(txRecord) as PaymentTransaction;
				if (payment.amount && payment.destination &&
					(this._addresses.has(payment.source) || this._addresses.has(payment.destination))) {
					_onPayment(payment);
				}
			}
		});
	}

	public addAddress(address: Address) {
		Utils.verifyValidAddressParam(address);
		this._addresses.add(address);
	}

	public removeAddress(address: Address) {
		Utils.verifyValidAddressParam(address);
		this._addresses.delete(address);
	}

	public close() {
		this._stream();
	}
}
