import Order from '../models/Order';

/**
 * Standalone Verification Script for Order Number Generation
 * This mocks the generation logic to ensure it correctly increments within an organization.
 */
async function testOrderNumberGeneration() {
    console.log('--- Testing Order Number Generation ---');

    const org1 = 'org-1';
    const org2 = 'org-2';

    // Mocking Order.findOne
    const originalFindOne = Order.findOne;

    // @ts-ignore
    Order.findOne = ((query: any) => {
        console.log(`Searching for last order in organization: ${query.organizationId}`);
        // Simulate that org-1 has one order and org-2 has none
        if (query.organizationId === org1) {
            return {
                sort: () => ({
                    select: async () => ({ orderNumber: 'ORD-2603-0005' })
                })
            };
        }
        return {
            sort: () => ({
                select: async () => null
            })
        };
    }) as any;

    try {
        const num1 = await (Order as any).generateOrderNumber(org1);
        console.log(`Org 1 Next Number (Expected: ORD-2603-0006): ${num1}`);
        if (num1 === 'ORD-2603-0006') console.log('✅ Org 1 incremented correctly');

        const num2 = await (Order as any).generateOrderNumber(org2);
        console.log(`Org 2 Next Number (Expected: ORD-2603-0001): ${num2}`);
        if (num2 === 'ORD-2603-0001') console.log('✅ Org 2 started correctly');

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        Order.findOne = originalFindOne;
    }

    console.log('--- Test Complete ---');
}

testOrderNumberGeneration().catch(console.error);
