
import {Transaction, TransactionId} from "./horizonModels"

export interface TransactionProcess {
    transaction(): Transaction;
    sendTransaction(transaction: Transaction): Promise<TransactionId>;
    sendTransactionEnvelope(transactionEnvelope: string): Promise<TransactionId>;
}

export interface TransactionInterceptor {
    interceptTransactionSending(process: TransactionProcess): Promise<TransactionId>;  
}