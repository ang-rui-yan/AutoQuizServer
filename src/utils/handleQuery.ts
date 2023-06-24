export const convertToString = (query: any) => {
	// Type guard to check if query is a string
	if (typeof query === 'string') {
		return query;
	} else {
		// Handle the case where query is an array or undefined
		// For example, you can join the array elements into a string
		return Array.isArray(query) ? query.join(',') : '';
	}
};
