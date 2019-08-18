import * as nock from "nock";
import * as KinSdk from "../../scripts/src/index";
import {KinAccount} from "../../scripts/src/kinAccount";
import {AccountDataRetriever} from "../../scripts/src/blockchain/accountDataRetriever";
import {
	AccountNotFoundError,
	BadRequestError,
	ErrorDecoder,
	ErrorResponse,
	LowBalanceError
} from "../../scripts/src/errors";
import {Environment} from "../../scripts/src/environment";
import {Memo, Network, Operation, Server} from "@kinecosystem/kin-sdk";
import {BlockchainInfoRetriever} from "../../scripts/src/blockchain/blockchainInfoRetriever";
import {MEMO_LENGTH_ERROR} from "../../scripts/src/config";
import { SimpleKeystoreProvider } from "./simple-provider";
import CreateAccount = Operation.CreateAccount;
import RetryData = Server.RetryData;

const horizonUrl = "http://horizon.com";
const headerKey = "user-agent";
const headerVal = "test-kin";

const mock500NetworkResponse: ErrorResponse = {
	"type": "https://stellar.org/horizon-errors/server_error",
	"title": "Internal server Error",
	"status": 500,
	"detail": "Internal server Error."
};
const senderPublic = "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65";
const senderKeystore = new SimpleKeystoreProvider(KinSdk, "SBVYIBM6UTDHMN7RN6VVEFKABRQBW3YB7W7RYFZFTBD6YX3IDFLS7NGW");
const receiverPublic = "GBFVXO4TI53WQVBCFZG7C4ZKPFP5Y6S6M3OZMTDVATUHQS7LXRWLWF5S";
const receiverPublic_2 = "GBW3U6FTJQ3JAZXSS46NHX7WF4SG2J5D6HKDBVDFHNVAKZRM672F2GDP";
const transactionId = "6ab7034086be38c62fbbabd09349d8cc49d59bfe0f7ad3ef6cf89c5a573eee95";
const appId = "aaaa";
const amount: number = 100;
const memo = "test memo";
let kinAccount: KinAccount;

const bodySendKin = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAFAAWczYAAAAHAAAAAAAAAAEAAAAQMS1hYWFhL" +
	"XRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTH" +
	"UE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAEDCr47RR1bk%2FI1TynPEgn937jX3pPXNyyMHPSAW28CtOIXspWiXV3pQe0xN3eZSz94" +
	"Y%2BNm5G8f0gCPmXxQXIJ4N";

const bodySendKin_2 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAQ" +
	"MS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3" +
	"HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAECVwez0u84Tk%2BNbQbh5srOCmYv4vE81P23nW6uy1oQAhpTuwJ%2Bm0Lbp" +
	"rWH9GGUl3zZV%2FZYcM9ghOJBRyZ55glcO";

const bodySendKin_3 = "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAXi3wAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAQAAAAAAAAABAAAAALGk81+NzKnst96N+pghxVE61OL/ZTzDk7HfJKdHPJJ0AAAAAAAAAAAAmJaAAAAAAAAAAAHsrih8AAAAQMVoAvHh39F3G4kW" +
	"naa/JWBPaoDgFLyND5s0mw3waQTiU7cp1eZ64N+ZrY2lRn9B4YinNMqfWauQjviJdPHOdwc=";

const bodyMissingMemoCreateAccount = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAA" +
	"AAHMS1hYWFhLQAAAAABAAAAAQAAAABvNPfjIRmfNq0ZrKFAxlZZEBnIxl2xdn1%2Btmkz7K4ofAAAAAAAAAAAbbp4s0w2kGbylzzT3%2FYvJG0no%2F" +
	"HUMNRlO2oFZiz39F0AAAAAAA9CQAAAAAAAAAAB7K4ofAAAAEAme%2F5beR7kQm9B%2B1b9CLd9swfG3dHLml0QRG72pOuOkqDAgIB%2BmryTtl4m7BY" +
	"M5SXNqjq80XPxgrTvfzPY%2F6oP";

const bodyCreateAccountRedirect = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAHAAAAAAAAAAEAAAAQ" +
	"MS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAQAAAABLW7uTR3doVCIuTfFzKnlf3" +
	"HpeZt2WTHUE6HhL67xsuwAAAAAAAAAAACONkAAAAAAAAAAB7K4ofAAAAECVwez0u84Tk%2BNbQbh5srOCmYv4vE81P23nW6uy1oQAhpTuwJ%2Bm0Lbp" +
	"rWH9GGUl3zZV%2FZYcM9ghOJBRyZ55glcO";

const bodyCreatAccount = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWFhL" +
	"XRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQw1G" +
	"U7agVmLPf0XQAAAAAAD0JAAAAAAAAAAAHsrih8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQQnH" +
	"SoYqHtaO0J%2BVLmwA%3D";

const bodyCreatAccount_2 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAACgAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWF" +
	"hLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2W" +
	"THUE6HhL67xsuwAAAAA7msoAAAAAAAAAAAHsrih8AAAAQIbUcMf2hOWK42YlO8cWIGnZIYuTPj739NhH8WeB5mIEgaNfwyrWvdNUkAInnNoTGu6DdbM" +
	"ky5izo9QEgLeZ0gg%3D";

const bodyCreateAccount_3 = "tx=AAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYW" +
	"FhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809%2BMhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAAAAAAABtunizTDaQZvKXPNPf9i8kbSej8dQ" +
	"w1GU7agVmLPf0XQAAAAAAD0JAAAAAAAAAAAHsrih8AAAAQAcqtM7IY%2FdojHCYDZHlGyU9khht6BmyFnYyffwcXgQXuYRyRbIEZFKawz4jQznYVSgQ" +
	"QnHSoYqHtaO0J%2BVLmwA%3D";

const bodyCreateAccount4 = "AAAAAOzY9WfVBnssuWevXxORz2d6Qfig4qWIRzwD1ObqTmkjAAAAZAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAA" +
	"AAABAAAAB2JsYSBibGEAAAAAAQAAAAAAAAAAAAAAAKSsO2j1EiYi4rydi+K+YdTC2HcWfMoKjHOd0/wIiaozAAAAAAX14QAAAAAAAAAAAepOaSMAAAB" +
	"AjwXKIwLrKSCjdfniUpIMlUIJCKOgGOIgbbHglPfXXqTVQslY8jm+/gg0paO2MMox/2QXuucftQktxZ3ni69LDA==";

const response400: ErrorResponse = {
	type: "https://stellar.org/horizon-errors/transaction_failed",
	title: "Transaction Failed",
	status: 400,
	detail: "The transaction failed when submitted to the stellar network. The `extras.result_codes` field on this" +
		" response contains further details.  Descriptions of each code can be found at: https://www.stellar.org" +
		"/developers/learn/concepts/list-of-operations.html",
	extras: {
		result_codes: {},
		result_xdr: "AAAAAAAAAAD////7AAAAAA=="
	}
};

const response404: ErrorResponse = {
	type: "https://stellar.org/horizon-errors/not_found",
	title: "Resource Missing",
	status: 404,
	detail: "The resource at the url requested was not found.  This is usually occurs for one of two reasons:  The url requested is not valid, or no data in our database could be found with the parameters provided."
};

function initKinAccount(retry?: RetryData) {
	const server = new Server(horizonUrl, {
		allowHttp: true,
		headers: new Map<string, string>().set(headerKey, headerVal),
		retry
	});
	const accountDataRetriever = new AccountDataRetriever(server);
	Network.use(new Network(Environment.Testnet.passphrase));
	kinAccount = new KinAccount(senderPublic, senderKeystore, accountDataRetriever, server, new BlockchainInfoRetriever(server), appId);
	nock.cleanAll();
}

describe("KinAccount create account transaction", async () => {
	beforeEach(async () => {
		initKinAccount();
	});

	test("builder transaction, create account succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount_2});

		const txBuilder = await kinAccount.getTransactionBuilder({
			fee: amount
		});
		txBuilder.addFee(10);
		txBuilder.addMemo(Memo.text(memo));
		txBuilder.addOperation(Operation.createAccount({
			source: senderPublic,
			destination: receiverPublic,
			startingBalance: "10000"
		}));
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});

	test("build create account with 0", async () => {
		mockLoadAccountResponse("6319125253062661");

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		const transaction = txBuilder.build();
		expect((transaction.operations[0] as CreateAccount).startingBalance).toEqual("0");
	});

	test("account created build transaction", async () => {
		mockLoadAccountResponse("6319125253062661");

		const txBuilder = await kinAccount.buildCreateAccount(
			{
				address: receiverPublic,
				startingBalance: 10000,
				fee: amount,
				memoText: memo
			});
		expect((txBuilder as any)._transactionBuilder.baseFee).toEqual(amount);
		expect((txBuilder as any)._transactionBuilder.memo._value).toEqual("1-" + appId + "-" + memo);
		expect((txBuilder as any)._transactionBuilder.source.id).toEqual(senderPublic);
		expect((txBuilder as any)._transactionBuilder.source.sequence).toEqual("6319125253062661");
		expect(txBuilder.build().toEnvelope().toXDR("base64")).toEqual("AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aT" +
			"Psrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAQMS1hYWFhLXRlc3QgbWVtbwAAAAEAAAABAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2f" +
			"X62aTPsrih8AAAAAAAAAABLW7uTR3doVCIuTfFzKnlf3HpeZt2WTHUE6HhL67xsuwAAAAA7msoAAAAAAAAAAAA=");
	});

	test("create account, send transaction succeed", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});

	test("create account, throw error - memo is too long", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		await expect(kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount,
			memoText: "Test minimum length is working"
		})).rejects.toEqual(new Error(MEMO_LENGTH_ERROR));
	});

	test("create account tx_insufficient_balance, error expect 400 ServerError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodyCreateAccount4;
		response.extras.result_codes.transaction = "tx_insufficient_balance";

		mockLoadAccountResponse("6319125253062657");
		mockTransactionErrorResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder.toString()))
			.rejects.toEqual(new LowBalanceError(response));
	});

	test("create account tx_bad_seq, error expect 400 ServerError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodyCreateAccount4;
		response.extras.result_codes.transaction = "tx_bad_seq";

		mockLoadAccountResponse("6319125253062657");
		mockTransactionErrorResponse(response);

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder.toString())).rejects.toEqual(new BadRequestError(response));
	});

	test("create account without memo", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyMissingMemoCreateAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});

	test("create account, add memo", async () => {
		mockLoadAccountResponse("6319125253062661");
		mockTransactionRequest({requestBody: bodyCreatAccount});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});

	// test("create account, account not exists - expect error", async () => {
	// 	mockLoadAccountErrorResponse(response404);
	// 	kinAccount.buildCreateAccount({
	// 			address: receiverPublic_2,
	// 			startingBalance: 10,
	// 			fee: amount
	// 		}).catch(err => {
	// 			expect(err).toEqual(new AccountNotFoundError(response404));
	// 		});
	// });
});

describe("KinAccount send kin transaction", async () => {

	beforeEach(async () => {
		initKinAccount();
	});

	test("send kin", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({requestBody: bodySendKin_2});

		const txBuilder = await kinAccount.buildTransaction({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});

	test("send kin, error expect 400 ServerError. when error tx_bad_seq expect BadRequestError", async () => {
		const response: ErrorResponse = response400;
		response.extras.envelope_xdr = bodySendKin_3;
		response.extras.result_codes.transaction = "tx_bad_seq";

		mockLoadAccountResponse("6319125253062657");
		mockTransactionErrorResponse(response);

		const txBuilder = await kinAccount.buildTransaction({
			address: receiverPublic,
			amount: 10,
			fee: amount,
			memoText: memo
		});
		await expect(kinAccount.submitTransaction(txBuilder.toString())).rejects.toEqual(new BadRequestError(response));
	});

	test("send kin, change fee before submitting transaction", async () => {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({requestBody: bodySendKin});

		const txBuilder = await kinAccount.buildTransaction({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		txBuilder.addFee(20);
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});
});

describe("KinAccount redirect", async () => {

	beforeEach(async () => {
		initKinAccount();
	});

	test("test get proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		nock(horizonUrl)
			.get(url => url.includes(senderPublic))
			.reply(307, undefined, {location: fakeUrl + "/accounts/" + senderPublic});
		mockLoadAccountResponse("6319125253062661", {url: fakeUrl});

		const createBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		const transaction = createBuilder.build();
		expect((transaction.operations[0] as CreateAccount).startingBalance).toEqual("0");
	});

	test("test post proxy redirect", async () => {
		const fakeUrl = "https://fake.url.com";
		mockLoadAccountResponse("6319125253062661");
		nock(horizonUrl)
			.post(url => true)
			.reply(307, undefined, {
				location: fakeUrl + "/transactions/" + bodyCreateAccountRedirect
			});
		mockTransactionRequest({url: fakeUrl, requestBody: bodyCreateAccount_3});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		expect(await kinAccount.submitTransaction(txBuilder.toString())).toEqual(transactionId);
	});
});

describe("KinAccount retry", async () => {

	const RETRY_COUNT = 4;

	beforeEach(async () => {
		initKinAccount({
			retries: RETRY_COUNT,
			// override delay for making tests faster
			retryDelay: () => 1
		});
	});

	test("retry for get request, response with errors less than retry threshold - should succeed", async () => {
		const builder = await buildTransaction("6319125253062662", RETRY_COUNT);
		const transaction = builder.build();
		expect(transaction.sequence).toEqual("6319125253062663");
	});

	// test("retry for get request, response with errors more than retry threshold - should failed", async () => {
	// 	await expect(buildTransaction("6319125253062662", RETRY_COUNT + 1))
	// 		.rejects.toEqual(ErrorDecoder.translate({response: mock500NetworkResponse}));
	// });

	async function buildTransaction(sequence: string, errorsCount: number) {
		mockLoadAccountResponse(sequence, {retry: errorsCount});

		// build send kin will load account which is get request
		const builder = await kinAccount.buildTransaction({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});
		return builder;
	}

	test("retry for post request, response with errors less than retry threshold - should succeed", async () => {
		expect(await submitTransaction(RETRY_COUNT)).toEqual(transactionId);
	});

	test("retry for post request, response with errors more than retry threshold - should failed", async () => {
		await expect(submitTransaction(RETRY_COUNT + 1))
			.rejects.toEqual(ErrorDecoder.translate({response: mock500NetworkResponse}));
	});

	async function submitTransaction(errorsCount: number) {
		mockLoadAccountResponse("6319125253062662");
		mockTransactionRequest({requestBody: bodySendKin_2, retry: errorsCount});

		const txBuilder = await kinAccount.buildTransaction({
			address: receiverPublic,
			amount: 23.3,
			fee: amount,
			memoText: memo
		});

		// submit transaction will make a post request to the blockchain
		return await kinAccount.submitTransaction(txBuilder.toString());
	}

	test("retry for get request with redirect, response with errors less than retry threshold - should succeed", async () => {
		// redirect "consumes" one retry, so retry will handle only RETRY_COUNT - 1 errors
		const createBuilder = await buildTransactionWithRedirect("6319125253062661", RETRY_COUNT - 1);
		const transaction = createBuilder.build();
		expect(transaction.sequence).toEqual("6319125253062662");
	});

	// test("retry for get request with redirect, response with errors more than retry threshold - should failed", async () => {
	// 	// redirect "consumes" one retry, so retry will failed with only RETRY_COUNT errors
	// 	await expect(buildTransactionWithRedirect("6319125253062661", RETRY_COUNT))
	// 		.rejects.toEqual(ErrorDecoder.translate({response: mock500NetworkResponse}));
	// });

	async function buildTransactionWithRedirect(sequence: string, errorsCount: number) {
		const fakeUrl = "https://fake.url.com";
		nock(horizonUrl)
			.get(url => url.includes(senderPublic))
			.reply(307, undefined, {location: fakeUrl + "/accounts/" + senderPublic});
		mockLoadAccountResponse(sequence, {retry: errorsCount});

		const createBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic,
			startingBalance: 0,
			fee: amount
		});
		return createBuilder;
	}

	test("retry for post request with redirect, response with errors less than retry threshold - should succeed", async () => {
		// redirect "consumes" one retry, so retry will handle only RETRY_COUNT - 1 errors
		expect(await submitTransactionWithRedirect(RETRY_COUNT - 1)).toEqual(transactionId);
	});

	test("retry for post request with redirect, response with errors more than retry threshold - should failed", async () => {
		// redirect "consumes" one retry, so retry will failed with only RETRY_COUNT errors
		await expect(submitTransactionWithRedirect(RETRY_COUNT))
			.rejects.toEqual(ErrorDecoder.translate({response: mock500NetworkResponse}));
	});

	async function submitTransactionWithRedirect(errorsCount: number) {
		const fakeUrl = "https://fake.url.com";
		mockLoadAccountResponse("6319125253062661");
		nock(horizonUrl)
			.post(url => true)
			.reply(307, undefined, {
				location: fakeUrl + "/transactions/" + bodyCreateAccountRedirect
			});
		mockTransactionRequest({retry: errorsCount, requestBody: bodyCreateAccount_3});

		const txBuilder = await kinAccount.buildCreateAccount({
			address: receiverPublic_2,
			startingBalance: 10,
			fee: amount
		});
		txBuilder.addMemo(Memo.text(memo));
		return kinAccount.submitTransaction(txBuilder.toString());
	}

});

function mockTransactionErrorResponse(response: ErrorResponse) {
	nock(horizonUrl)
		.matchHeader(headerKey, headerVal)
		.post(url => url.includes("/transactions"), /tx=\w+/gi)
		.reply(response.status, response);
}

function mockLoadAccountErrorResponse(response: ErrorResponse) {
	nock(horizonUrl)
		.matchHeader(headerKey, headerVal)
		.get(url => true)
		.reply(response.status, response);
}

function mockLoadAccountResponse(sequence: string, options?: { url?: string, retry?: number }) {
	const builder = nock(options && options.url ? options.url : horizonUrl)
		.matchHeader(headerKey, headerVal);
	if (options && options.retry) {
		builder.get(url => true)
			.times(options.retry)
			.reply(mock500NetworkResponse.status, mock500NetworkResponse);
	}
	builder.get(url => url.includes(senderPublic))
		.reply(200,
			{
				"_links": {
					"self": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65"
					},
					"transactions": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/transactions{?cursor,limit,order}",
						"templated": true
					},
					"operations": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/operations{?cursor,limit,order}",
						"templated": true
					},
					"payments": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/payments{?cursor,limit,order}",
						"templated": true
					},
					"effects": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/effects{?cursor,limit,order}",
						"templated": true
					},
					"offers": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/offers{?cursor,limit,order}",
						"templated": true
					},
					"trades": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/trades{?cursor,limit,order}",
						"templated": true
					},
					"data": {
						"href": "https://horizon-testnet.kininfrastructure.com/accounts/GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOI" +
							"YZO3C5T5P23GSM7MVYUHZK65/data/{key}",
						"templated": true
					}
				},
				"id": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
				"paging_token": "",
				"account_id": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
				"sequence": sequence,
				"subentry_count": 0,
				"thresholds": {
					"low_threshold": 0,
					"med_threshold": 0,
					"high_threshold": 0
				},
				"flags": {
					"auth_required": false,
					"auth_revocable": false,
					"auth_immutable": false
				},
				"balances": [
					{
						"balance": "9899.99900",
						"buying_liabilities": "0.00000",
						"selling_liabilities": "0.00000",
						"asset_type": "native"
					}
				],
				"signers": [
					{
						"public_key": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
						"weight": 1,
						"key": "GBXTJ57DEEMZ6NVNDGWKCQGGKZMRAGOIYZO3C5T5P23GSM7MVYUHZK65",
						"type": "ed25519_public_key"
					}
				],
				"data": {}
			}
		);
}

function mockTransactionRequest(options: { url?: string, retry?: number, requestBody: string, hash?: string }) {
	const builder = nock(options && options.url ? options.url : horizonUrl)
		.matchHeader(headerKey, headerVal);
	if (options && options.retry) {
		builder.post(url => true)
			.times(options.retry)
			.reply(mock500NetworkResponse.status, mock500NetworkResponse);
	}
	builder.post(url => url.includes("/transactions"), options.requestBody)
		.reply(200,
			{
				"_links": {
					"transaction": {
						"href": "https://horizon-testnet.kininfrastructure.com/transactions/" + transactionId
					}
				},
				"hash": transactionId,
				"ledger": 1761292,
				"envelope_xdr": "AAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAZAAWczYAAAAGAAAAAAAAAAEAAAAJdGVzdCB" +
					"tZW1vAAAAAAAAAQAAAAEAAAAAbzT34yEZnzatGayhQMZWWRAZyMZdsXZ9frZpM+yuKHwAAAAAAAAAAG26eLNMNpBm8pc809/2Ly" +
					"RtJ6Px1DDUZTtqBWYs9/RdAAAAAAAPQkAAAAAAAAAAAeyuKHwAAABAR1kR5lr0GnNYwajx4JJ7W1dnO3Pjl8soKjgKH6AK6c8Mg" +
					"KLEeyh24TJkOKPrxFmnYnr3uhXTPy+hJTQv7R6ZCg==",
				"result_xdr": "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA=",
				"result_meta_xdr": "AAAAAAAAAAEAAAADAAAAAAAa4AwAAAAAAAAAAG26eLNMNpBm8pc809/2LyRtJ6Px1DDUZTtqBWYs9/RdAAAA" +
					"AAAPQkAAGuAMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAa4AwAAAAAAAAAAG809+MhGZ82rRmsoUD" +
					"GVlkQGcjGXbF2fX62aTPsrih8AAAAALHhZ8gAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAa4A" +
					"wAAAAAAAAAAG809+MhGZ82rRmsoUDGVlkQGcjGXbF2fX62aTPsrih8AAAAALHSJYgAFnM2AAAABgAAAAAAAAAAAAAAAAAAAAABA" +
					"AAAAAAAAAAAAAAAAAAA"
			});
}
