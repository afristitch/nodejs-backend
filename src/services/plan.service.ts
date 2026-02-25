import Plan from '../models/Plan';

/**
 * Plan Service
 * Handles management of subscription plans
 */

/**
 * Seed default plans if they don't exist
 * Prices are in GHS
 */
export const seedPlans = async () => {
    const defaultPlans = [
        {
            name: 'free',
            description: 'Basic features for small tailor shops',
            price: 0,
            currency: 'GHS',
            interval: 'monthly',
            isActive: true,
        },
        {
            name: 'premium',
            description: 'Full features, unlimited orders and clients',
            price: 50, // 50 GHS per month
            currency: 'GHS',
            interval: 'monthly',
            isActive: true,
        }
    ];

    for (const planData of defaultPlans) {
        const existingPlan = await Plan.findOne({ name: planData.name });
        if (!existingPlan) {
            await Plan.create(planData);
        }
    }

    console.log('Default plans synchronized successfully in GHS');
};


/**
 * Get all active plans
 */
export const getActivePlans = async () => {
    return await Plan.find({ isActive: true });
};

/**
 * Get plan by name
 * @param {string} name 
 */
export const getPlanByName = async (name: string) => {
    return await Plan.findOne({ name });
};

/**
 * Get plan by ID
 * @param {string} id 
 */
export const getPlanById = async (id: string) => {
    return await Plan.findById(id);
};

const planService = {
    seedPlans,
    getActivePlans,
    getPlanByName,
    getPlanById,
};

export default planService;
