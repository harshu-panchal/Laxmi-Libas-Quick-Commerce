
import { StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';

const builder = StandardCheckoutPayRequest.builder();
console.log('Available methods on builder:');
console.log(Object.getOwnPropertyNames(builder));
console.log(Object.keys(builder));
console.log(builder);
