# Fixed Payment History API Documentation

## Overview
This API allows tracking monthly payment status for fixed payments. Users can mark payments as paid/unpaid, view payment history, and get statistics.

## Base URL
```
http://localhost:5001/api/fixed-payments
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Monthly Status with History
Get all fixed payments with their payment status for a specific month.

**Endpoint:** `GET /history/monthly-status`

**Query Parameters:**
- `month` (optional): Month (1-12), defaults to current month
- `year` (optional): Year (2020-2030), defaults to current year

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "payments": [
      {
        "id": 21,
        "name": "Elektrik Faturası",
        "amount": 500,
        "category": "Faturalar",
        "dueDay": 5,
        "isPaid": true,
        "paidDate": "2024-01-05",
        "paidAmount": 500,
        "transactionId": 123,
        "notes": "Paid on time"
      }
    ],
    "statistics": {
      "totalPayments": 5,
      "paidCount": 3,
      "unpaidCount": 2,
      "totalAmount": 2500,
      "paidAmount": 1500,
      "unpaidAmount": 1000,
      "completionRate": 60
    }
  }
}
```

### 2. Get Payment Statistics
Get payment statistics for a specific month.

**Endpoint:** `GET /history/statistics`

**Query Parameters:**
- `month` (optional): Month (1-12)
- `year` (optional): Year (2020-2030)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "statistics": {
      "totalPayments": 5,
      "paidCount": 3,
      "unpaidCount": 2,
      "totalAmount": 2500,
      "paidAmount": 1500,
      "unpaidAmount": 1000,
      "completionRate": 60
    }
  }
}
```

### 3. Get Unpaid Payments
Get all unpaid payments for a specific month.

**Endpoint:** `GET /history/unpaid`

**Query Parameters:**
- `month` (optional): Month (1-12)
- `year` (optional): Year (2020-2030)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "payments": [
      {
        "id": 20,
        "name": "Su Faturası",
        "amount": 150,
        "category": "Faturalar",
        "dueDay": 10
      }
    ]
  }
}
```

### 4. Get Paid Payments
Get all paid payments for a specific month.

**Endpoint:** `GET /history/paid`

**Query Parameters:**
- `month` (optional): Month (1-12)
- `year` (optional): Year (2020-2030)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "payments": [
      {
        "id": 21,
        "name": "Elektrik Faturası",
        "amount": 500,
        "category": "Faturalar",
        "dueDay": 5,
        "paidDate": "2024-01-05",
        "paidAmount": 500,
        "transactionId": 123
      }
    ]
  }
}
```

### 5. Get Overdue Payments
Get all overdue payments (past due date and not paid) for a specific month.

**Endpoint:** `GET /history/overdue`

**Query Parameters:**
- `month` (optional): Month (1-12)
- `year` (optional): Year (2020-2030)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2024,
    "payments": [
      {
        "id": 20,
        "name": "Su Faturası",
        "amount": 150,
        "category": "Faturalar",
        "dueDay": 10,
        "daysOverdue": 6
      }
    ]
  }
}
```

### 6. Get Payment History
Get payment history for a specific fixed payment.

**Endpoint:** `GET /:id/history`

**Path Parameters:**
- `id`: Fixed payment ID

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 12)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "fixedPaymentId": 21,
    "fixedPaymentName": "Elektrik Faturası",
    "history": [
      {
        "id": 1,
        "userId": 1,
        "fixedPaymentId": 21,
        "paymentMonth": 1,
        "paymentYear": 2024,
        "isPaid": true,
        "paidDate": "2024-01-05",
        "paidAmount": 500,
        "transactionId": 123,
        "notes": "Paid on time",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-05T10:30:00.000Z"
      }
    ]
  }
}
```

### 7. Mark Payment as Paid
Mark a fixed payment as paid for a specific month.

**Endpoint:** `POST /:id/mark-paid`

**Path Parameters:**
- `id`: Fixed payment ID

**Request Body:**
```json
{
  "month": 1,
  "year": 2024,
  "paidDate": "2024-01-05",
  "paidAmount": 500,
  "transactionId": 123,
  "notes": "Paid via bank transfer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme başarıyla işaretlendi",
  "data": {
    "id": 1,
    "userId": 1,
    "fixedPaymentId": 21,
    "paymentMonth": 1,
    "paymentYear": 2024,
    "isPaid": true,
    "paidDate": "2024-01-05",
    "paidAmount": 500,
    "transactionId": 123,
    "notes": "Paid via bank transfer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-05T10:30:00.000Z"
  }
}
```

### 8. Mark Payment as Unpaid
Mark a fixed payment as unpaid for a specific month.

**Endpoint:** `POST /:id/mark-unpaid`

**Path Parameters:**
- `id`: Fixed payment ID

**Request Body:**
```json
{
  "month": 1,
  "year": 2024
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme ödenmedi olarak işaretlendi",
  "data": {
    "id": 1,
    "userId": 1,
    "fixedPaymentId": 21,
    "paymentMonth": 1,
    "paymentYear": 2024,
    "isPaid": false,
    "paidDate": null,
    "paidAmount": null,
    "transactionId": null,
    "notes": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-05T11:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Geçersiz veri",
  "errors": [
    {
      "msg": "Ay 1-12 arası olmalıdır",
      "param": "month",
      "location": "query"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Sabit ödeme bulunamadı"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Ödeme işaretlenirken hata oluştu"
}
```

## Usage Examples

### Example 1: Check monthly payment status
```bash
curl -X GET "http://localhost:5001/api/fixed-payments/history/monthly-status?month=1&year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Mark a payment as paid
```bash
curl -X POST "http://localhost:5001/api/fixed-payments/21/mark-paid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 1,
    "year": 2024,
    "paidAmount": 500,
    "notes": "Paid via bank transfer"
  }'
```

### Example 3: Get payment statistics
```bash
curl -X GET "http://localhost:5001/api/fixed-payments/history/statistics?month=1&year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Features

✅ Track payment status for each month
✅ Mark payments as paid/unpaid
✅ View payment history
✅ Get payment statistics (completion rate, totals)
✅ Identify overdue payments
✅ Auto-create monthly records
✅ Link payments to transactions
✅ Add notes to payments

## Database Schema

The `fixed_payment_history` table stores:
- User ID and fixed payment ID
- Payment month and year
- Payment status (paid/unpaid)
- Paid date and amount
- Transaction reference
- Notes

Unique constraint ensures one record per payment per month/year.
