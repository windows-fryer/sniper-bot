const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const textDecode = (data: Uint8Array) => textDecoder.decode(data);
export const textEncode = (data: string) => textEncoder.encode(data);