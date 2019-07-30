import {KinAccount} from "../../scripts/src";
import {Channels, KeyPair, KinClient} from "../../scripts/src";
import {Keypair, Memo, Network, Operation, Transaction as XdrTransaction} from "@kinecosystem/kin-base";
import {Server} from "@kinecosystem/kin-sdk";
import {INTEG_ENV} from "./integConfig";

const keyPair = KeyPair.generate();
const secondKeypair = KeyPair.generate();

let client: KinClient;
let sender: KinAccount;
let receiver: KinAccount;

describe("KinAccount", async () => {
	beforeAll(async () => {
		client = new KinClient(INTEG_ENV);
		sender = client.createKinAccount({ seed: keyPair.seed });
		receiver = client.createKinAccount({seed: secondKeypair.seed});
		const transactionId = await client.friendbot({ address: keyPair.publicAddress, amount: 10000 });
		const secondTransactionId = await client.friendbot({address: secondKeypair.publicAddress, amount: 10000});
		expect(transactionId).toBeDefined();
		expect(secondTransactionId).toBeDefined();

	}, 60000);

	test("Create sender with channels, the receiver history must be related to the channel private key", async done => {
		const thirdKeypair = KeyPair.generate();
		await client.friendbot({ address: thirdKeypair.publicAddress, amount: 10000 });
		const keyPairs = await Channels.createChannels({
			environment: INTEG_ENV,
			baseSeed: thirdKeypair.seed,
			salt: "salt salt",
			channelsCount: 2,
			startingBalance: 1000
		});

		const account3 = client.createKinAccount({
			seed: thirdKeypair.seed, channelSecretKeys: keyPairs.map(keypair => {
				return keypair.seed;
			})
		});
		await account3.channelsPool!!.acquireChannel(async channel1 => {
			const builder = await account3.buildSendKin({
				address: secondKeypair.publicAddress,
				amount: 200,
				fee: 100,
				memoText: "Send with channels",
				channel: channel1
			});
			await account3.submitTransaction(builder);
			const history2 = await client.getRawTransactionHistory({
				address: secondKeypair.publicAddress,
				order: "desc"
			});
			expect(history2[0].source).toBe(channel1.keyPair.publicAddress);
			expect((history2[0]).operations[0].source).toBe(thirdKeypair.publicAddress);
			done();
		});

	}, 60000);

	test("Test create sender", async () => {
		const localKeypair = KeyPair.generate();
		const txBuilder = await sender.buildCreateAccount({
			fee: 100,
			startingBalance: 1500,
			memoText: "Test create sender",
			address: localKeypair.publicAddress
		});

		await sender.submitTransaction(txBuilder);
		const isExist = await client.isAccountExisting(localKeypair.publicAddress);
		const balance = await client.getAccountBalance(localKeypair.publicAddress);
		expect(isExist).toBe(true);
		expect(balance).toBe(1500);
	}, 30000);

	test("Test send kin", async () => {
		const txBuilder = await sender.buildSendKin({
			fee: 100,
			amount: 150,
			memoText: "Test create sender",
			address: receiver.publicAddress

		});

		const balance = await client.getAccountBalance(keyPair.publicAddress);
		const secondBalance = await client.getAccountBalance(secondKeypair.publicAddress);
		await sender.submitTransaction(txBuilder);
		const balance2 = await client.getAccountBalance(keyPair.publicAddress);
		const secondBalance2 = await client.getAccountBalance(secondKeypair.publicAddress);
		expect(balance2).toBe(balance - 150 - 0.001);
		expect(secondBalance2).toBe(secondBalance + 150);

	}, 60000);

	test("Test whitelist send kin", async () => {
		const server = new Server(INTEG_ENV.url);
		// use premade whitelisted account GAJCKSF6YXOS52FIIP5MWQY2NGZLCG6RDEKYACETVRA7XV72QRHUKYBJ
		const whitelistAccount = client.createKinAccount({seed: "SDH76EUIJRM4LARRAOWPBGEAWJMRXFUDCFNBEBMMIO74AWB3MZJYGJ4J"});
		const txBuilder = await sender.buildSendKin({
			amount: 250,
			memoText: "Test whitelist",
			address: receiver.publicAddress,
			fee: 0
		});

		const transaction = txBuilder.build();
		const signers = new Array<Keypair>();
		signers.push(Keypair.fromSecret(keyPair.seed));
		transaction.sign(...signers);
		const envelop = transaction.toEnvelope().toXDR("base64").toString();
		const whiteTx = await whitelistAccount.whitelistTransaction({
			envelope: envelop,
			networkId: Network.current().networkPassphrase()
		});

		const balance = await client.getAccountBalance(sender.publicAddress);
		const xdrTransaction = new XdrTransaction(whiteTx);
		// A hack to submit a string as a transaction, should be use txSender.submitTransaction.
		await server.submitTransaction(xdrTransaction);
		const balance2 = await client.getAccountBalance(sender.publicAddress);

		expect(balance2).toBe(balance - 250);

	}, 60000);

	test("Test get data and balances", async () => {
		const txBuilder = await sender.buildSendKin({
			fee: 100,
			amount: 150,
			memoText: "Test get data",
			address: receiver.publicAddress

		});
		await sender.submitTransaction(txBuilder);
		const data = await receiver.getData();
		const balance = await receiver.getBalance();
		expect(data.accountId).toBe(receiver.publicAddress);
		expect(data.balances[0].balance).toBe(balance);

	}, 60000);

	test("Test \"manage data\" operation", async () => {
		const opVal = "new data";
		const builder = await sender.getTransactionBuilder({
			fee: 100
		});
		builder.setTimeout(0);
		builder.addMemo(Memo.text("Test memo"));
		builder.addOperation(Operation.manageData({
			name: "test", source: "", value: opVal
		}));
		await sender.submitTransaction(builder);
		const data = await sender.getData();

		const buff = Buffer.from(opVal);
		const base64data = buff.toString("base64");

		expect((data as any).data.test).toBe(base64data);

	}, 60000);
});
