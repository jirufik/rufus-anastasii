export class BaseDto {
  // @ts-expect-error its okay
  constructor(params?: { partial?: Partial<this> }) {
    if (params?.partial) {
      this.assign(params.partial);
    }
  }

  getName(): string {
    const ctorName: string = this.constructor.name;
    return ctorName.endsWith('Dto') || ctorName.toLowerCase().endsWith('dto') ? ctorName.slice(0, -3) : ctorName;
  }

  assign<T>(obj: Partial<T | this>): void {
    Object.assign(this, obj);
  }

  private getNestedField(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => {
      if (Array.isArray(acc) && !Number.isNaN(Number(key))) {
        return acc[Number(key)];
      }
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  private setNestedField(obj: any, path: string, value: any): void {
    const keys: string[] = path.split('.');
    const lastKey: string = keys.pop()!;
    const target: any = keys.reduce((acc, key) => {
      if (Array.isArray(acc) && !Number.isNaN(Number(key))) {
        return acc[Number(key)];
      }
      return (acc[key] = acc[key] || {});
    }, obj);
    target[lastKey] = value;
  }

  private deleteNestedField(obj: any, path: string): void {
    const keys: string[] = path.split('.');
    const lastKey: string = keys.pop()!;
    const target: any = keys.reduce((acc, key) => {
      if (Array.isArray(acc) && !Number.isNaN(Number(key))) {
        return acc[Number(key)];
      }
      return acc ? acc[key] : undefined;
    }, obj);
    if (target && lastKey in target) {
      delete target[lastKey];
    }
  }

  removeFields(params: { fieldNames: string[] }): this {
    params.fieldNames.forEach((field: string) => this.deleteNestedField(this, field));
    return this;
  }

  removeAllFields(): this {
    Object.keys(this).forEach((key: string) => delete this[key]);
    return this;
  }

  maskFields(params: { fieldNames: string[]; mask?: string }): this {
    params.fieldNames.forEach((field: string) => {
      if (this.getNestedField(this, field) !== undefined) {
        this.setNestedField(this, field, params.mask || '****');
      }
    });
    return this;
  }

  merge<T>(params: { obj: Partial<T | BaseDto>; onlyExisting?: boolean }): this {
    if (params?.onlyExisting) {
      Object.keys(params?.obj).forEach((key: string) => {
        if (key in this) {
          (this as any)[key] = (params?.obj as any)[key];
        }
      });
    } else {
      Object.assign(this, params?.obj);
    }
    return this;
  }

  copy(): this {
    try {
      const plain: this = structuredClone(this);
      // @ts-expect-error its okay
      return new (this.constructor as { new (params?: { partial?: Partial<this> }): this })({ partial: plain });
    } catch {
      return new (this.constructor as {
        // @ts-expect-error its okay
        new (params?: { partial?: Partial<this> }): this;
      })({ partial: this });
    }
  }
}
