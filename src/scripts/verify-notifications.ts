import apnsService from '../services/apns.service';
import firebaseService from '../services/firebase.service';
import notificationService from '../services/notification.service';
import DeviceToken from '../models/DeviceToken';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

/**
 * Standalone Verification Script
 * This script demonstrates the routing logic without requiring a Jest test runner.
 */
async function testRouting() {
    console.log('--- Testing Notification Routing ---');

    const userId = 'test-user-123';
    const notificationData = {
        title: 'Test Notification',
        message: 'Hello World',
        type: 'TEST'
    };

    // 1. Manually "Spy" on the services by overriding their methods temporarily
    let apnsCalled = false;
    let firebaseCalled = false;

    const originalApnsMulticast = apnsService.sendMulticastNotification;
    const originalFirebaseMulticast = firebaseService.sendMulticastNotification;
    const originalDeviceTokenFind = DeviceToken.find;
    const originalNotificationCreate = Notification.create;

    // Set up overrides
    apnsService.sendMulticastNotification = async () => { apnsCalled = true; };
    firebaseService.sendMulticastNotification = async () => { firebaseCalled = true; };

    // Use 'any' casting to bypass complex Mongoose types for the mock
    // @ts-ignore
    DeviceToken.find = (async () => {
        return [
            { userId, token: 'ios-token-1', platform: 'ios' },
            { userId, token: 'android-token-1', platform: 'android' }
        ];
    }) as any;

    // @ts-ignore
    Notification.create = (async () => ({ _id: new mongoose.Types.ObjectId() })) as any;

    try {
        console.log('Sending notification to user...');
        await notificationService.sendToUser(userId, notificationData);

        // 2. Verify results
        console.log('Verifying service routing...');

        if (apnsCalled) {
            console.log('✅ Success: APNS Service was invoked for iOS token');
        } else {
            console.error('❌ Failure: APNS Service NOT invoked for iOS token');
        }

        if (firebaseCalled) {
            console.log('✅ Success: Firebase Service was invoked for Android token');
        } else {
            console.error('❌ Failure: Firebase Service NOT invoked for Android token');
        }

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        // Restore original methods
        apnsService.sendMulticastNotification = originalApnsMulticast;
        firebaseService.sendMulticastNotification = originalFirebaseMulticast;
        DeviceToken.find = originalDeviceTokenFind;
        Notification.create = originalNotificationCreate;
    }

    console.log('--- Test Complete ---');
}

// Run the test
testRouting().catch(console.error);
