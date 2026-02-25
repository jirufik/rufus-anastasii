import { TransactionOptionsDto } from '../crud/dto/transaction-options.dto';
import { BaseService } from '../services/base.service';
import { EntityManager } from '@mikro-orm/core';

export function Transactional(
  params: {
    transactionOptions?: TransactionOptionsDto;
  } = {},
) {
  const { transactionOptions } = params;
  return function (target: BaseService, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    const metadataKeys = Reflect.getMetadataKeys(originalMethod);
    const metadata = metadataKeys.reduce((acc, key) => {
      acc[key] = Reflect.getMetadata(key, originalMethod);
      return acc;
    }, {});

    descriptor.value = async function (...args: any[]) {
      const service = this as BaseService;
      return service.runInTransaction((em: EntityManager) => {
        return originalMethod.apply(this, [...args, em]);
      }, transactionOptions);
    };

    for (const [key, value] of Object.entries(metadata)) {
      Reflect.defineMetadata(key, value, descriptor.value);
    }

    return descriptor;
  };
}
