declare namespace DataValidator {
    interface ObjectValidator {
        _name: string;
        properties: {
            [key: string]: {
                type: string;
                mandatory?: boolean;
                values?: string;
            };
        };
    }
    function registerValidator(validator: ObjectValidator): void;
    function checkChildIntegrity(childObject: any, validatorType: string): boolean;
    function checkDataIntegrity(data: any, mainValidator: ObjectValidator, ...additionalValidators: ObjectValidator[]): boolean;
}
