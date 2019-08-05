const PACKAGE_JSON = require("../../package.json");

export const ANON_APP_ID: string = "anon";
export const ADDRESS_LENGTH: number = 56;
export const APP_ID_REGEX: RegExp = new RegExp("^[a-zA-Z0-9]{3,4}$");
export const MEMO_LENGTH_ERROR: string = "Memo must be up to 28 characters, including memo prefix.";
export const MEMO_LENGTH: number = 21;

export const GLOBAL_HEADERS = new Map<string, string>();
if (typeof window === "undefined") {
	GLOBAL_HEADERS.set("user-agent", "kin-sdk-node-" + PACKAGE_JSON.version)
		.set("kin-sdk-node-version", PACKAGE_JSON.version);
}

export const GLOBAL_RETRY = { retries: 4 };
