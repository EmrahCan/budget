// Test script for FixedPaymentHistory model
const FixedPaymentHistory = require('./models/FixedPaymentHistory');

async function testFixedPaymentHistory() {
  console.log('🧪 Testing FixedPaymentHistory Model...\n');

  try {
    // Test 1: Get monthly status for user 1, January 2024
    console.log('Test 1: Get monthly status');
    const monthlyStatus = await FixedPaymentHistory.getMonthlyStatus(1, 1, 2024);
    console.log('Monthly Status:', JSON.stringify(monthlyStatus, null, 2));
    console.log('✅ Test 1 passed\n');

    // Test 2: Get payment statistics
    console.log('Test 2: Get payment statistics');
    const stats = await FixedPaymentHistory.getPaymentStatistics(1, 1, 2024);
    console.log('Statistics:', JSON.stringify(stats, null, 2));
    console.log('✅ Test 2 passed\n');

    // Test 3: Get unpaid payments
    console.log('Test 3: Get unpaid payments');
    const unpaid = await FixedPaymentHistory.getUnpaidPayments(1, 1, 2024);
    console.log('Unpaid Payments:', JSON.stringify(unpaid, null, 2));
    console.log('✅ Test 3 passed\n');

    // Test 4: Mark a payment as paid (if there are any unpaid)
    if (unpaid.length > 0) {
      console.log('Test 4: Mark payment as paid');
      const firstUnpaid = unpaid[0];
      const marked = await FixedPaymentHistory.markAsPaid(
        firstUnpaid.id,
        1,
        1,
        2024,
        {
          paidDate: new Date(),
          paidAmount: firstUnpaid.amount,
          notes: 'Test payment'
        }
      );
      console.log('Marked as paid:', JSON.stringify(marked.toJSON(), null, 2));
      console.log('✅ Test 4 passed\n');

      // Test 5: Check if payment is paid
      console.log('Test 5: Check if payment is paid');
      const isPaid = await FixedPaymentHistory.isPaid(firstUnpaid.id, 1, 2024);
      console.log('Is Paid:', isPaid);
      console.log('✅ Test 5 passed\n');

      // Test 6: Get paid payments
      console.log('Test 6: Get paid payments');
      const paid = await FixedPaymentHistory.getPaidPayments(1, 1, 2024);
      console.log('Paid Payments:', JSON.stringify(paid, null, 2));
      console.log('✅ Test 6 passed\n');
    }

    // Test 7: Auto-create monthly records
    console.log('Test 7: Auto-create monthly records for February 2024');
    const created = await FixedPaymentHistory.autoCreateMonthlyRecords(1, 2, 2024);
    console.log(`Created ${created.length} records`);
    console.log('✅ Test 7 passed\n');

    console.log('✅ All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFixedPaymentHistory();
