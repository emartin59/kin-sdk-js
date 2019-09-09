import {
	Account,
	Memo,
	MemoText,
	MemoType,
	Transaction as XdrTransaction,
	TransactionBuilder as BaseTransactionBuilder,
	xdr
} from "@kinecosystem/kin-sdk";
import {Channel, Address} from "./horizonModels";
import {MEMO_LENGTH, MEMO_LENGTH_ERROR} from "../config";
import { TxSender, KeystoreProvider } from "..";

interface TransactionBuilderOptions extends BaseTransactionBuilder.TransactionBuilderOptions {
	fee: number;
	appId?: string;
	memo?: Memo<MemoType.Text>;
	channel?: Channel;
	keyStoreProvider: KeystoreProvider
}

export class TransactionBuilder {

	private readonly _transactionBuilder: BaseTransactionBuilder;
	private readonly _channel?: Channel;
	private readonly _appId?: string;
	private readonly _keyStoreProvider?: KeystoreProvider

	constructor(sourceAccount: Account, options: TransactionBuilderOptions) {
		this._transactionBuilder = new BaseTransactionBuilder(sourceAccount, options);
		this._appId = options.appId;
		this.addFee(options.fee);
		this.addMemo(options.memo ? options.memo : Memo.text(""));
		this._channel = options.channel;
		this._keyStoreProvider = options.keyStoreProvider
	}

	public addFee(fee: number): this {
		if (typeof fee === "number" && fee >= 0) {
			(this as any)._transactionBuilder.baseFee = fee;
		} else {
			throw new TypeError("Fee must be a positive number");
		}
		return this;
	}

	public setTimeout(timeout: number) {
		this._transactionBuilder.setTimeout(timeout);
		return this;
	}

	public addTextMemo(memo: string) {
		if (memo && typeof memo === "string" && memo.length > MEMO_LENGTH) {
			throw new Error(MEMO_LENGTH_ERROR);
		}
		this.addMemo(memo ? Memo.text(memo) : Memo.text(""));
	}

	public addMemo(memo: Memo): this {
		if (!memo) {
			throw new TypeError("Memo must be defined.");
		}
		if (typeof memo.value === "string" && memo.value.length > MEMO_LENGTH) {
			throw new Error(MEMO_LENGTH_ERROR);
		}
		if (memo.type === MemoText) {
			this._transactionBuilder.addMemo(Memo.text("1-" + this._appId + "-" + memo.value));
		} else {
			this._transactionBuilder.addMemo(memo);
		}

		return this;
	}

	public addOperation(operation: xdr.Operation): this {
		this._transactionBuilder.addOperation(operation);
		return this;
	}

	public get channel(): Channel | undefined {
		return this._channel;
	}

	public build(): XdrTransaction {
		return this._transactionBuilder.build();
	}
}
