import unittest
import json
import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import app, is_valid_date, VALID_CATEGORIES


class ExpenseTrackerTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.created_ids = []

    def tearDown(self):
        # Clean up any items created during test cases
        for item_id in self.created_ids:
            try:
                self.client.delete(f'/api/expenses/{item_id}')
            except Exception:
                pass

    def test_date_validator(self):
        self.assertTrue(is_valid_date('2026-11-10'))
        self.assertTrue(is_valid_date('2024-02-29'))  # Leap year
        self.assertFalse(is_valid_date('2026-02-31'))  # Non-existent day
        self.assertFalse(is_valid_date('2026-04-31'))  # April has 30 days
        self.assertFalse(is_valid_date('invalid-date'))
        self.assertFalse(is_valid_date(''))

    def test_get_expenses(self):
        res = self.client.get('/api/expenses')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsInstance(data, list)

    def test_get_summary(self):
        res = self.client.get('/api/expenses/summary')
        self.assertEqual(res.status_code, 200)
        summary = res.get_json()
        self.assertIn('totalSpent', summary)
        self.assertIn('expenseCount', summary)
        self.assertIn('averageSpent', summary)
        self.assertIn('categories', summary)
        self.assertIn('dailyBreakdown', summary)

    def test_crud_lifecycle(self):
        # 1. Create expense
        payload = {
            'title': 'Test Groceries',
            'amount': 450.75,
            'category': 'Food',
            'date': '2026-11-10',
            'note': 'Test note for expense lifecycle'
        }
        res = self.client.post('/api/expenses', json=payload)
        self.assertEqual(res.status_code, 201)
        created = res.get_json()
        self.assertEqual(created['title'], 'Test Groceries')
        self.assertEqual(created['amount'], 450.75)
        self.assertEqual(created['category'], 'Food')
        expense_id = created['id']
        self.created_ids.append(expense_id)

        # 2. Update expense
        update_payload = {
            'title': 'Updated Test Groceries',
            'amount': 500,
            'category': 'Food',
            'date': '2026-11-10',
            'note': 'Updated note'
        }
        res = self.client.put(f'/api/expenses/{expense_id}', json=update_payload)
        self.assertEqual(res.status_code, 200)
        updated = res.get_json()
        self.assertEqual(updated['title'], 'Updated Test Groceries')
        self.assertEqual(updated['amount'], 500)

        # 3. Verify in list with search query
        res = self.client.get('/api/expenses?search=Updated+Test')
        self.assertEqual(res.status_code, 200)
        results = res.get_json()
        matching = [e for e in results if e['id'] == expense_id]
        self.assertEqual(len(matching), 1)

        # 4. Delete expense
        res = self.client.delete(f'/api/expenses/{expense_id}')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('success'))
        self.created_ids.remove(expense_id)

        # 5. Verify deletion
        res = self.client.put(f'/api/expenses/{expense_id}', json=update_payload)
        self.assertEqual(res.status_code, 404)

    def test_validation_errors(self):
        # Empty title
        res = self.client.post('/api/expenses', json={
            'title': '   ',
            'amount': 100,
            'category': 'Food',
            'date': '2026-11-10'
        })
        self.assertEqual(res.status_code, 400)

        # Negative amount
        res = self.client.post('/api/expenses', json={
            'title': 'Coffee',
            'amount': -50,
            'category': 'Food',
            'date': '2026-11-10'
        })
        self.assertEqual(res.status_code, 400)

        # Invalid category
        res = self.client.post('/api/expenses', json={
            'title': 'Coffee',
            'amount': 50,
            'category': 'InvalidCategory',
            'date': '2026-11-10'
        })
        self.assertEqual(res.status_code, 400)

        # Invalid date
        res = self.client.post('/api/expenses', json={
            'title': 'Coffee',
            'amount': 50,
            'category': 'Food',
            'date': '2026-02-31'
        })
        self.assertEqual(res.status_code, 400)


if __name__ == '__main__':
    unittest.main()

