import os
import json
import uuid
import re
import calendar
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))

DATA_DIR = os.path.join(BASE_DIR, 'data')
DATA_FILE = os.path.join(DATA_DIR, 'expenses.json')
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'dist'))

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

VALID_CATEGORIES = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Other',
]

# Initialize Supabase client if configured
supabase_client = None
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
if '/rest/v1' in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split('/rest/v1')[0]
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"Connected to Supabase at: {SUPABASE_URL}")
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}. Falling back to file storage.")
        supabase_client = None
else:
    print("Supabase credentials not found. Using local JSON storage.")


def is_valid_date(date_str: str) -> bool:
    if not date_str or not isinstance(date_str, str):
        return False
    match = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', date_str)
    if not match:
        return False
    year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
    if month < 1 or month > 12:
        return False
    if year < 1900 or year > 2100:
        return False
    try:
        parsed = datetime(year, month, day)
        return parsed.year == year and parsed.month == month and parsed.day == day
    except ValueError:
        return False


def get_initial_seed_data():
    now = datetime.now()
    current_year = now.year
    current_month_num = now.month
    current_month = f"{current_year}-{current_month_num:02d}"

    if current_month_num == 1:
        prev_month = f"{current_year - 1}-12"
    else:
        prev_month = f"{current_year}-{current_month_num - 1:02d}"

    def iso_ago(hours: int):
        return (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat().replace("+00:00", "Z")

    return [
        {
            "id": str(uuid.uuid4()),
            "title": "Coffee & Breakfast at Blue Tokai",
            "amount": 380,
            "category": "Food",
            "date": f"{current_month}-10",
            "note": "Cappuccino with croissant",
            "createdAt": iso_ago(2),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Metro Monthly Smart Card",
            "amount": 1200,
            "category": "Transport",
            "date": f"{current_month}-08",
            "note": "Monthly city metro pass reload",
            "createdAt": iso_ago(48),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Weekly Grocery Essentials",
            "amount": 3450,
            "category": "Food",
            "date": f"{current_month}-07",
            "note": "Fresh vegetables, dairy, pulses, and pantry staples",
            "createdAt": iso_ago(72),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Broadband Fiber Internet Bill",
            "amount": 999,
            "category": "Bills",
            "date": f"{current_month}-05",
            "note": "200Mbps unlimited fiber auto-debit",
            "createdAt": iso_ago(120),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Weekend Movie Tickets & Snacks",
            "amount": 850,
            "category": "Entertainment",
            "date": f"{current_month}-03",
            "note": "PVR IMAX tickets with popcorn",
            "createdAt": iso_ago(168),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Winter Jacket",
            "amount": 2999,
            "category": "Shopping",
            "date": f"{current_month}-02",
            "note": "Warm fleece zip jacket",
            "createdAt": iso_ago(192),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Electricity & Utility Bill",
            "amount": 1850,
            "category": "Bills",
            "date": f"{prev_month}-28",
            "note": "Monthly power and water bill",
            "createdAt": iso_ago(300),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dinner at Punjabi Rasoi",
            "amount": 1450,
            "category": "Food",
            "date": f"{prev_month}-24",
            "note": "Family dinner with desserts",
            "createdAt": iso_ago(400),
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Airport Cab Ride",
            "amount": 780,
            "category": "Transport",
            "date": f"{prev_month}-20",
            "note": "Ola cab to terminal 3",
            "createdAt": iso_ago(500),
        },
    ]


# Mapping functions between Supabase columns and Frontend formats
def row_to_frontend(row: dict) -> dict:
    if not row:
        return {}
    return {
        'id': row.get('id'),
        'title': row.get('title'),
        'amount': float(row.get('amount', 0)),
        'category': row.get('category'),
        'date': str(row.get('expense_date') or row.get('date') or ''),
        'note': row.get('note'),
        'createdAt': row.get('created_at') or row.get('createdAt'),
        'updatedAt': row.get('updated_at') or row.get('updatedAt'),
    }


def to_supabase_payload(data: dict) -> dict:
    payload = {
        'title': data['title'],
        'amount': data['amount'],
        'category': data['category'],
        'expense_date': data['date'],
    }
    if 'id' in data:
        payload['id'] = data['id']
    if 'note' in data:
        payload['note'] = data['note']
    return payload


# Local file fallback helpers
def ensure_data_file():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        seeds = get_initial_seed_data()
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(seeds, f, indent=2, ensure_ascii=False)


def read_expenses_file():
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return [row_to_frontend(e) for e in data] if isinstance(data, list) else []
    except Exception as e:
        print(f"Error reading expenses file: {e}")
        return []


def write_expenses_file(expenses):
    ensure_data_file()
    temp_file = f"{DATA_FILE}.tmp"
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(expenses, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, DATA_FILE)


# Database operations with Supabase / File fallback
def db_get_expenses(category=None, from_date=None, to_date=None, search=None):
    if supabase_client:
        try:
            query = supabase_client.table('expenses').select('*')
            if category and category != 'All' and category in VALID_CATEGORIES:
                query = query.eq('category', category)
            if from_date:
                query = query.gte('expense_date', from_date)
            if to_date:
                query = query.lte('expense_date', to_date)
            
            query = query.order('expense_date', desc=True).order('created_at', desc=True)
            res = query.execute()
            rows = [row_to_frontend(r) for r in res.data]

            # In-memory search filtering (covers title and note)
            if search and search.strip():
                q = search.strip().lower()
                rows = [
                    r for r in rows
                    if q in r.get('title', '').lower() or (r.get('note') and q in r.get('note', '').lower())
                ]
            return rows
        except Exception as e:
            print(f"Supabase get_expenses error, falling back to file: {e}")

    # Fallback to local file
    expenses = read_expenses_file()
    if category and category != 'All' and category in VALID_CATEGORIES:
        expenses = [e for e in expenses if e.get('category') == category]
    if from_date:
        expenses = [e for e in expenses if e.get('date', '') >= from_date]
    if to_date:
        expenses = [e for e in expenses if e.get('date', '') <= to_date]
    if search and search.strip():
        q = search.strip().lower()
        expenses = [
            e for e in expenses
            if q in e.get('title', '').lower() or (e.get('note') and q in e.get('note', '').lower())
        ]
    expenses.sort(key=lambda e: (e.get('date', ''), e.get('createdAt', '')), reverse=True)
    return expenses


def db_create_expense(data):
    if supabase_client:
        try:
            payload = to_supabase_payload(data)
            res = supabase_client.table('expenses').insert(payload).execute()
            if res.data:
                return row_to_frontend(res.data[0])
        except Exception as e:
            print(f"Supabase create_expense error, falling back to file: {e}")

    # Fallback to file
    expenses = read_expenses_file()
    new_expense = {
        'id': data.get('id', str(uuid.uuid4())),
        'title': data['title'],
        'amount': data['amount'],
        'category': data['category'],
        'date': data['date'],
        'note': data.get('note'),
        'createdAt': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    expenses.insert(0, new_expense)
    write_expenses_file(expenses)
    return new_expense


def db_update_expense(expense_id, data):
    if supabase_client:
        try:
            payload = to_supabase_payload(data)
            payload['updated_at'] = datetime.now(timezone.utc).isoformat()
            res = supabase_client.table('expenses').update(payload).eq('id', expense_id).execute()
            if res.data:
                return row_to_frontend(res.data[0])
            return None
        except Exception as e:
            print(f"Supabase update_expense error, falling back to file: {e}")

    # Fallback to file
    expenses = read_expenses_file()
    idx = next((i for i, e in enumerate(expenses) if e.get('id') == expense_id), -1)
    if idx == -1:
        return None
    updated = dict(expenses[idx])
    updated.update({
        'title': data['title'],
        'amount': data['amount'],
        'category': data['category'],
        'date': data['date'],
        'note': data.get('note'),
        'updatedAt': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    })
    expenses[idx] = updated
    write_expenses_file(expenses)
    return updated


def db_delete_expense(expense_id):
    deleted_record = None

    # 1. Try to delete from Supabase
    if supabase_client:
        try:
            # First fetch the record if possible so we have full metadata to return
            try:
                get_res = supabase_client.table('expenses').select('*').eq('id', expense_id).execute()
                if get_res.data:
                    deleted_record = row_to_frontend(get_res.data[0])
            except Exception as select_err:
                print(f"Supabase select before delete notice: {select_err}")

            del_res = supabase_client.table('expenses').delete().eq('id', expense_id).execute()
            if not deleted_record and del_res.data:
                deleted_record = row_to_frontend(del_res.data[0])
        except Exception as e:
            print(f"Supabase delete_expense error: {e}")

    # 2. Also ensure deleted from local file fallback
    try:
        expenses = read_expenses_file()
        idx = next((i for i, e in enumerate(expenses) if e.get('id') == expense_id), -1)
        if idx != -1:
            file_deleted = expenses.pop(idx)
            write_expenses_file(expenses)
            if not deleted_record:
                deleted_record = file_deleted
    except Exception as e:
        print(f"Local file delete error: {e}")

    if deleted_record:
        return deleted_record

    # If already deleted or id passed, return confirmed deleted id object
    return {'id': expense_id}


def db_clear_all_expenses():
    count = 0
    if supabase_client:
        try:
            del_res = supabase_client.table('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            count = len(del_res.data) if del_res.data else 0
        except Exception as e:
            print(f"Supabase clear_all error: {e}")

    # Also clear local file
    try:
        expenses = read_expenses_file()
        count = max(count, len(expenses))
        write_expenses_file([])
    except Exception as e:
        print(f"Local file clear error: {e}")

    return count


def db_reset_demo():
    seeds = get_initial_seed_data()
    if supabase_client:
        try:
            # Clear existing expenses
            supabase_client.table('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            # Insert seed items
            payloads = [to_supabase_payload(s) for s in seeds]
            supabase_client.table('expenses').insert(payloads).execute()
            return seeds
        except Exception as e:
            print(f"Supabase reset_demo error, falling back to file: {e}")

    # Fallback to file
    write_expenses_file(seeds)
    return seeds


# Auto-seed Supabase on startup if it is currently empty
def auto_seed_if_empty():
    if supabase_client:
        try:
            res = supabase_client.table('expenses').select('id').limit(1).execute()
            if not res.data:
                print("Supabase expenses table is empty. Seeding initial demo data...")
                db_reset_demo()
                print("Seeded demo expenses to Supabase successfully!")
        except Exception as e:
            print(f"Could not check/seed Supabase table: {e}")


auto_seed_if_empty()


# 1. GET /api/expenses
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    try:
        category = request.args.get('category')
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        search = request.args.get('search')

        # Filter by Date Range (from / to)
        filter_from = from_date if from_date and is_valid_date(from_date) else None
        filter_to = to_date if to_date and is_valid_date(to_date) else None

        # Automatically swap if from > to
        if filter_from and filter_to and filter_from > filter_to:
            filter_from, filter_to = filter_to, filter_from

        expenses = db_get_expenses(
            category=category,
            from_date=filter_from,
            to_date=filter_to,
            search=search,
        )

        return jsonify(expenses)
    except Exception as e:
        print(f"GET /api/expenses error: {e}")
        return jsonify({'error': 'Failed to retrieve expenses'}), 500


# 2. GET /api/expenses/summary
@app.route('/api/expenses/summary', methods=['GET'])
def get_summary():
    try:
        now = datetime.now()
        current_month_str = f"{now.year}-{now.month:02d}"
        target_month = request.args.get('month', current_month_str)

        if not re.match(r'^\d{4}-\d{2}$', target_month):
            return jsonify({'error': 'Invalid month format. Expected YYYY-MM.'}), 400

        year_str, month_str = target_month.split('-')
        year = int(year_str)
        month = int(month_str)

        if month < 1 or month > 12:
            return jsonify({'error': 'Invalid month. Must be between 01 and 12.'}), 400

        _, days_in_month = calendar.monthrange(year, month)
        start_date = f"{target_month}-01"
        end_date = f"{target_month}-{days_in_month:02d}"

        # Retrieve expenses for the target month
        month_expenses = db_get_expenses(from_date=start_date, to_date=end_date)

        total_spent = sum(e.get('amount', 0) for e in month_expenses)
        expense_count = len(month_expenses)
        average_spent = total_spent / expense_count if expense_count > 0 else 0

        # Breakdown by category
        category_totals = {cat: {'total': 0.0, 'count': 0} for cat in VALID_CATEGORIES}
        for exp in month_expenses:
            cat = exp.get('category')
            amt = exp.get('amount', 0)
            if cat in category_totals:
                category_totals[cat]['total'] += amt
                category_totals[cat]['count'] += 1
            else:
                category_totals[cat] = {'total': amt, 'count': 1}

        categories = []
        for cat in VALID_CATEGORIES:
            data = category_totals[cat]
            pct = (data['total'] / total_spent * 100) if total_spent > 0 else 0
            categories.append({
                'category': cat,
                'total': round(data['total'], 2),
                'count': data['count'],
                'percentage': round(pct, 1),
            })

        # Highest spending category
        highest_category = None
        sorted_cats = sorted(categories, key=lambda c: c['total'], reverse=True)
        if sorted_cats and sorted_cats[0]['total'] > 0:
            highest_category = {
                'category': sorted_cats[0]['category'],
                'total': sorted_cats[0]['total'],
                'percentage': sorted_cats[0]['percentage'],
            }

        # Month display name
        month_date = datetime(year, month, 1)
        month_name = month_date.strftime('%B %Y')

        # Daily breakdown
        daily_map = {d: {'total': 0.0, 'count': 0} for d in range(1, days_in_month + 1)}

        for exp in month_expenses:
            try:
                day_num = int(exp.get('date', '').split('-')[2])
                if day_num in daily_map:
                    daily_map[day_num]['total'] += exp.get('amount', 0)
                    daily_map[day_num]['count'] += 1
            except (IndexError, ValueError):
                continue

        daily_breakdown = [
            {
                'day': d,
                'date': f"{target_month}-{d:02d}",
                'total': round(daily_map[d]['total'], 2),
                'count': daily_map[d]['count'],
            }
            for d in range(1, days_in_month + 1)
        ]

        return jsonify({
            'month': target_month,
            'monthName': month_name,
            'totalSpent': round(total_spent, 2),
            'expenseCount': expense_count,
            'averageSpent': round(average_spent, 2),
            'categories': categories,
            'highestCategory': highest_category,
            'dailyBreakdown': daily_breakdown,
        })
    except Exception as e:
        print(f"GET /api/expenses/summary error: {e}")
        return jsonify({'error': 'Failed to calculate monthly summary'}), 500


# 3. POST /api/expenses
@app.route('/api/expenses', methods=['POST'])
def create_expense():
    try:
        data = request.get_json(silent=True) or {}
        title = data.get('title')
        amount = data.get('amount')
        category = data.get('category')
        date_val = data.get('date')
        note = data.get('note')

        # Validation: Title
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({'error': 'Title is required and cannot be empty'}), 400
        if len(title.strip()) > 100:
            return jsonify({'error': 'Title must be 100 characters or fewer'}), 400

        # Validation: Amount
        try:
            num_amount = float(amount)
        except (TypeError, ValueError):
            return jsonify({'error': 'Amount must be a positive number greater than ₹0'}), 400

        if num_amount <= 0:
            return jsonify({'error': 'Amount must be a positive number greater than ₹0'}), 400
        if num_amount > 10000000:
            return jsonify({'error': 'Amount cannot exceed ₹1,00,00,000 (1 Crore)'}), 400

        # Validation: Category
        if not category or category not in VALID_CATEGORIES:
            return jsonify({'error': f"Category must be one of: {', '.join(VALID_CATEGORIES)}"}), 400

        # Validation: Date
        if not is_valid_date(date_val):
            return jsonify({'error': 'Invalid calendar date. Must be valid YYYY-MM-DD.'}), 400

        new_record = db_create_expense({
            'id': str(uuid.uuid4()),
            'title': title.strip(),
            'amount': round(num_amount, 2),
            'category': category,
            'date': date_val,
            'note': note.strip()[:500] if isinstance(note, str) and note.strip() else None,
        })

        return jsonify(new_record), 201
    except Exception as e:
        print(f"POST /api/expenses error: {e}")
        return jsonify({'error': 'Failed to create expense'}), 500


# 4. PUT /api/expenses/<id>
@app.route('/api/expenses/<expense_id>', methods=['PUT'])
def update_expense(expense_id):
    try:
        data = request.get_json(silent=True) or {}
        title = data.get('title')
        amount = data.get('amount')
        category = data.get('category')
        date_val = data.get('date')
        note = data.get('note')

        # Validation: Title
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({'error': 'Title is required and cannot be empty'}), 400
        if len(title.strip()) > 100:
            return jsonify({'error': 'Title must be 100 characters or fewer'}), 400

        # Validation: Amount
        try:
            num_amount = float(amount)
        except (TypeError, ValueError):
            return jsonify({'error': 'Amount must be a positive number greater than ₹0'}), 400

        if num_amount <= 0:
            return jsonify({'error': 'Amount must be a positive number greater than ₹0'}), 400
        if num_amount > 10000000:
            return jsonify({'error': 'Amount cannot exceed ₹1,00,00,000 (1 Crore)'}), 400

        # Validation: Category
        if not category or category not in VALID_CATEGORIES:
            return jsonify({'error': f"Category must be one of: {', '.join(VALID_CATEGORIES)}"}), 400

        # Validation: Date
        if not is_valid_date(date_val):
            return jsonify({'error': 'Invalid calendar date. Must be valid YYYY-MM-DD.'}), 400

        updated = db_update_expense(expense_id, {
            'title': title.strip(),
            'amount': round(num_amount, 2),
            'category': category,
            'date': date_val,
            'note': note.strip()[:500] if isinstance(note, str) and note.strip() else None,
        })

        if not updated:
            return jsonify({'error': 'Expense not found'}), 404

        return jsonify(updated)
    except Exception as e:
        print(f"PUT /api/expenses/{expense_id} error: {e}")
        return jsonify({'error': 'Failed to update expense'}), 500


# 5. DELETE /api/expenses/<id>
@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        deleted = db_delete_expense(expense_id)
        if not deleted:
            return jsonify({'error': 'Expense not found'}), 404

        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        print(f"DELETE /api/expenses/{expense_id} error: {e}")
        return jsonify({'error': 'Failed to delete expense'}), 500


# 6. POST /api/expenses/reset-demo
@app.route('/api/expenses/reset-demo', methods=['POST'])
def reset_demo():
    try:
        seeds = db_reset_demo()
        return jsonify({'success': True, 'count': len(seeds)})
    except Exception as e:
        print(f"POST /api/expenses/reset-demo error: {e}")
        return jsonify({'error': 'Failed to reset demo expenses'}), 500


# 7. POST & DELETE /api/expenses/clear-all
@app.route('/api/expenses/clear-all', methods=['POST', 'DELETE'])
def clear_all():
    try:
        count = db_clear_all_expenses()
        return jsonify({'success': True, 'clearedCount': count})
    except Exception as e:
        print(f"POST /api/expenses/clear-all error: {e}")
        return jsonify({'error': 'Failed to clear all expenses'}), 500


# Serve static frontend in production (dist directory)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    if os.path.exists(os.path.join(DIST_DIR, 'index.html')):
        return send_from_directory(DIST_DIR, 'index.html')
    return jsonify({'status': 'Python backend running. Frontend dist not found. Run npm run build or use Vite dev server.'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Python Flask server running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
