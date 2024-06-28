interface Environment {
	region: string;
	project: string;
	environment: string;
	accountId: string;
	tblName: string;
}

export const environments: { [key: string]: Environment } = {
	dev: {
		region: '',
		project: '',
		environment: 'dev',
		accountId: '',
		tblName: '',
	},

	prod: {
		region: '',
		project: '',
		environment: 'prod',
		accountId: '',
		tblName: '',
	},
};
