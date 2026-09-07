const validatorModule = {
    validateEmptyField: async (fields) => {
        let result = {};
        for (let prop in fields) {
            if (fields[prop])
                result[prop] = fields[prop];
        }
        return result;
    }

};

export default validatorModule;
