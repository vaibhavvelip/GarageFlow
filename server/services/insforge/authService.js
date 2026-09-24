const { insforgeClient, insforgeAdmin, getUserClient } = require('./client');

/**
 * Register a new customer via InsForge Auth and initialize their profile.
 * Server-side role enforcement: regular signups default strictly to 'CUSTOMER'.
 */
async function registerUser({ email, password, name, phone, role = 'CUSTOMER' }) {
    // Enforce role assignment: Public registration cannot self-assign 'ADMIN'
    const assignedRole = role === 'ADMIN' ? 'CUSTOMER' : role;

    // 1. Create user in InsForge Auth
    const { data: authData, error: authError } = await insforgeClient.auth.signUp({
        email,
        password,
        name
    });

    if (authError) {
        throw new Error(authError.message || 'InsForge Auth registration failed');
    }

    const userId = authData?.user?.id || authData?.id;
    if (!userId) {
        console.error('[InsForge Auth] Unexpected authData format:', JSON.stringify(authData));
        throw new Error('User account created but user ID was not returned');
    }

    // 2. Synchronize profile in public.profiles table using admin client to ensure proper record creation
    const { data: profileData, error: profileError } = await insforgeAdmin.database
        .from('profiles')
        .insert([{
            id: userId,
            name: name || authData.user.name || '',
            email: email,
            phone: phone || '',
            role: assignedRole
        }])
        .select();

    if (profileError) {
        console.error('[InsForge Auth] Profile sync error:', profileError);
    }

    return {
        user: {
            id: userId,
            email: authData.user.email,
            name,
            phone,
            role: assignedRole
        },
        session: authData.session || null,
        accessToken: authData.accessToken || null
    };
}

/**
 * Authenticate customer or admin with InsForge Auth.
 * Retrieves verified role directly from database-side profiles table.
 */
async function loginUser({ email, password }) {
    const { data, error } = await insforgeClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(error.message || 'Invalid email or password');
    }

    const userId = data.user.id;

    // Fetch verified profile from database
    const { data: profile, error: profileError } = await insforgeAdmin.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

    const userProfile = profile && profile.length > 0 ? profile[0] : null;

    return {
        user: {
            id: userId,
            email: data.user.email,
            name: userProfile?.name || data.user.name || 'User',
            phone: userProfile?.phone || '',
            role: userProfile?.role || 'CUSTOMER'
        },
        accessToken: data.accessToken,
        session: data.session
    };
}

/**
 * Get profile for an authenticated user.
 */
async function getUserProfile(userId) {
    const { data, error } = await insforgeAdmin.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

/**
 * Update user profile in InsForge profiles table.
 */
async function updateUserProfile(userId, { name, phone }) {
    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (phone) updatePayload.phone = phone;

    const { data, error } = await insforgeAdmin.database
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select();

    if (error) throw new Error(error.message);
    return data && data.length > 0 ? data[0] : null;
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
};
