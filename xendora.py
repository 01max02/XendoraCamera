import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask import Flask, render_template, send_from_directory, jsonify
import os
from werkzeug.utils import secure_filename
from flask_mail import Mail, Message
from random import randint
from flask_wtf.csrf import CSRFProtect
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from datetime import datetime, timedelta
import string
import random
from flask_sqlalchemy import SQLAlchemy
from models import db, Cart, Wishlist
from PIL import Image

app = Flask(__name__)
app.secret_key = 'secret_key_for_flash_messages'

# Initialize SQLAlchemy with the app
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/xendora_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Configure upload folder
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Add this near your app configuration
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Configure allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app.config["MAIL_SERVER"] = 'smtp.gmail.com'
app.config["MAIL_PORT"] = 465
app.config["MAIL_USERNAME"] = 'xendora.ecom@gmail.com '  # Your Gmail
app.config['MAIL_PASSWORD'] = 'syzz knjo ouap ioqd' # Your App Password
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

mail = Mail(app)

# MySQL connection settings
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",  
        user="root",  
        password="", 
        database="xendora_db" 
    )

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_accounts WHERE email = %s", (email,))  # Changed from accounts to user_accounts
    user = cursor.fetchone()
    conn.close()
    return user
def update_password_in_db(email, new_password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE user_accounts SET password = %s WHERE email = %s", (new_password, email))  # Changed from accounts to user_accounts
    conn.commit()
    conn.close()

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/backtologin', methods=['GET', 'POST'])
def backtologin():
    return render_template('login.html')

@app.route('/homepage')
def homepage():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Fetch all products with seller information
        cursor.execute("""
            SELECT p.*, u.first_name, u.last_name, u.email as seller_email
            FROM products p
            JOIN user_accounts u ON p.seller_email = u.email
            ORDER BY p.created_at DESC
        """)
        
        featured_products = cursor.fetchall()
        
        # Get user's wishlist if logged in
        user_wishlist = set()
        if 'email' in session:
            cursor.execute("""
                SELECT product_id FROM wishlist 
                WHERE user_email = %s
            """, (session['email'],))
            user_wishlist = {item['product_id'] for item in cursor.fetchall()}
        
        return render_template('homepage.html', 
                             featured_products=featured_products,
                             user_wishlist=user_wishlist)
                             
    except Exception as e:
        print(f"Error: {str(e)}")
        return redirect(url_for('home'))
        
    finally:
        cursor.close()
        connection.close()

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        if 'email' in request.form:
            email = request.form['email']
            user = get_user_by_email(email)

            if user:
                # Generate a password reset code
                reset_code = randint(100000, 999999)

                # Send the reset email
                msg = Message(
                    subject="Password Reset Request",
                    sender=app.config["MAIL_USERNAME"],
                    recipients=[email]
                )
                msg.body = f"Hello, {user['first_name']}!\n\nTo reset your password, please use the following code:\n\n{reset_code}\n\nIf you didn't request this, please ignore this email."
                mail.send(msg)

                # Store the reset code and email in the session
                session['reset_code'] = reset_code
                session['user_email'] = email

                flash("A password reset email has been sent to your email address.", "success")
                return render_template('forgot_password.html', email_sent=True)

            else:
                flash("Email not found. Please check and try again.", "error")
                return redirect(url_for('forgot_password'))
        
        elif 'reset_code' in request.form:
            entered_code = request.form['reset_code']
            new_password = request.form['new_password']
            confirm_password = request.form['confirm_password']

            # Verify the reset code
            if entered_code == str(session.get('reset_code')):
                if new_password == confirm_password:
                    # Update password in database
                    update_password_in_db(session['user_email'], new_password)

                    flash("Your password has been reset successfully!", "success")
                    return redirect(url_for('home'))
                else:
                    flash("Passwords do not match. Please try again.", "error")
                    return redirect(url_for('forgot_password'))
            else:
                flash("Invalid reset code. Please try again.", "error")
                return redirect(url_for('forgot_password'))

    return render_template('forgot_password.html')

@app.route('/search')

def search():
    query = request.args.get('query', '').strip()
    if not query:
        return render_template('Accessories.html', products=[], query=query)

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # Perform a case-insensitive search by name
        cursor.execute("SELECT * FROM products WHERE name LIKE %s", (f"%{query}%",))
        products = cursor.fetchall()
    except mysql.connector.Error as err:
        print("Database error:", err)
        products = []
    finally:
        cursor.close()
        connection.close()

    # Render Accessories.html with the search results
    return render_template('Accessories.html', products=products, query=query)



@app.route('/profile', methods=['GET', 'POST'])
def profile():
    # Check if user is logged in
    user_id = session.get('user_id')
    if user_id is None:
        flash('You need to log in to access your profile.', 'error')
        return redirect(url_for('home'))  # Redirect to home if not logged in

    if request.method == 'POST':
        # Handle file upload
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                
                # Update the database with the new filename
                connection = get_db_connection()
                cursor = connection.cursor()
                cursor.execute(
                    "UPDATE user_accounts SET profile_image = %s WHERE id = %s",  # Changed from accounts to user_accounts
                    (filename, session['user_id'])
                )
                connection.commit()
                cursor.close()
                connection.close()

        # Handle profile update logic
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        email = request.form['email']
        phone_number = request.form['phone_number']
        address = request.form['address']
        
        # Set optional fields to None if they're not included in the form submission
        valid_id = request.form.get('valid_id') if 'valid_id' in request.form else None

        try:
            connection = get_db_connection()
            cursor = connection.cursor()
            cursor.execute(
                """
                UPDATE user_accounts 
                SET first_name = %s, last_name = %s, email = %s, phone_number = %s, address = %s, 
                    valid_id = %s 
                WHERE id = %s
                """,  # Changed from accounts to user_accounts
                (first_name, last_name, email, phone_number, address, valid_id, user_id)
            )
            connection.commit()
        except mysql.connector.Error as err:
            flash(f"Error updating profile: {err}", 'error')
        finally:
            cursor.close()
            connection.close()

    # Fetch the current user's profile data to display in the form
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT first_name, last_name, email, phone_number, address, valid_id, user_type FROM user_accounts WHERE id = %s", (user_id,))  # Changed from accounts to user_accounts
        user_data = cursor.fetchone()
        cursor.close()
        connection.close()

        if user_data is None:
            flash('User data not found.', 'error')
            return redirect(url_for('home'))  # Redirect if user data not found

    except mysql.connector.Error as err:
        flash(f"Error fetching profile data: {err}", 'error')
        return redirect(url_for('home'))

    # Pass user type to the template to conditionally render the fields
    return render_template('profile.html', user_data=user_data)

@app.route('/change-password', methods=['GET', 'POST'])
def change_password():
    # Check if user is logged in
    user_id = session.get('user_id')
    if user_id is None:
        flash('You need to log in to change your password.', 'error')
        return redirect(url_for('home'))

    if request.method == 'POST':
        # Update these to match the form field names
        current_password = request.form['current_password']  # Changed from old_password
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']

        if new_password != confirm_password:
            flash('New password and confirm password do not match.', 'error')
            return redirect(url_for('change_password'))

        try:
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            # Verify current password
            cursor.execute("SELECT password FROM user_accounts WHERE id = %s", (user_id,))
            user_data = cursor.fetchone()

            if user_data is None or user_data['password'] != current_password:  # Changed from old_password
                flash('Incorrect current password.', 'error')
                return redirect(url_for('change_password'))

            # Update the password
            cursor.execute(
                "UPDATE user_accounts SET password = %s WHERE id = %s",
                (new_password, user_id)
            )
            connection.commit()
            flash('Password updated successfully!', 'success')
            
            return redirect(url_for('profile'))

        except mysql.connector.Error as err:
            flash(f"Error updating password: {err}", 'error')
        finally:
            cursor.close()
            connection.close()

    return render_template('change_password.html')

@app.route('/check-old-password', methods=['POST'])
def check_old_password():
    user_id = session.get('user_id')
    if user_id is None:
        return jsonify(valid=False), 401  # User not logged in

    data = request.get_json()
    old_password = data.get("old_password")

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Fetch the stored password for comparison
        cursor.execute("SELECT password FROM user_accounts WHERE id = %s", (user_id,))  # Changed from accounts to user_accounts
        user_data = cursor.fetchone()
        
        if user_data and user_data['password'] == old_password:
            return jsonify(valid=True)  # Password matches
        else:
            return jsonify(valid=False)  # Password does not match

    except mysql.connector.Error as err:
        print("Database error:", err)
        return jsonify(valid=False), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/register', methods=['POST'])
def register():
    try:
        # Get form data
        data = {
            'first_name': request.form['first_name'],
            'last_name': request.form['last_name'],
            'email': request.form['email'],
            'phone_number': request.form['phone_number'],
            'address': request.form['address'],
            'password': request.form['password'],
            'confirm_password': request.form['confirm_password'],
            'user_type': request.form['user_type']
        }

        # Validate phone number
        if not data['phone_number'].isdigit() or len(data['phone_number']) != 10:
            return jsonify({
                'success': False,
                'error': "Phone number must be exactly 10 digits."
            })

        # Check if passwords match
        if data['password'] != data['confirm_password']:
            return jsonify({
                'success': False,
                'error': "Passwords do not match."
            })

        # Check email existence
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM (
                SELECT email FROM user_accounts
                UNION 
                SELECT email FROM pending_sellers
            ) AS combined_emails 
            WHERE email = %s
        ''', (data['email'],))
        
        if cursor.fetchone()[0] > 0:
            return jsonify({
                'success': False,
                'error': "Email already registered! Please use another email."
            })

        # Handle file uploads for sellers
        valid_id_filename = None
        bir_filename = None
        
        if data['user_type'] == 'Seller':
            if 'valid_id' not in request.files:
                return jsonify({
                    'success': False,
                    'error': "Valid ID is required for sellers."
                })
                
            valid_id = request.files['valid_id']
            if valid_id.filename == '':
                return jsonify({
                    'success': False,
                    'error': "Valid ID file is required."
                })

            if valid_id and allowed_file(valid_id.filename):
                valid_id_filename = secure_filename(valid_id.filename)
                valid_id.save(os.path.join(app.config['UPLOAD_FOLDER'], valid_id_filename))

            # Handle BIR certificate
            if 'bir' in request.files:
                bir = request.files['bir']
                if bir.filename != '':
                    if allowed_file(bir.filename):
                        bir_filename = secure_filename(bir.filename)
                        bir.save(os.path.join(app.config['UPLOAD_FOLDER'], bir_filename))

        # Generate and store OTP
        otp = randint(100000, 999999)
        session['otp'] = otp
        session['email'] = data['email']
        session['registration_data'] = {
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone_number': data['phone_number'],
            'address': data['address'],
            'password': data['password'],
            'user_type': data['user_type'],
            'valid_id': valid_id_filename,
            'bir': bir_filename
        }

        # Send OTP email
        try:
            msg = Message(
                'OTP Verification',
                sender='xendora.ecom@gmail.com',
                recipients=[data['email']]
            )
            msg.body = f'Your verification code is: {otp}'
            mail.send(msg)
        except Exception as e:
            print(f"Email error: {str(e)}")
            return jsonify({
                'success': False,
                'error': "Error sending verification email. Please try again."
            })

        return jsonify({
            'success': True,
            'message': "Please check your email for the verification code."
        })

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"Registration failed: {str(e)}"
        })
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()


@app.route('/otp_verification', methods=['GET', 'POST'])
def otp_verification():
    if request.method == 'POST':
        try:
            user_otp = request.get_json().get('otp')
            
            # Debug print
            print(f"Session OTP: {session.get('otp')}, User OTP: {user_otp}")
            
            if 'otp' not in session:
                return jsonify({
                    'success': False,
                    'error': 'OTP session expired. Please request a new OTP.'
                })

            if int(user_otp) == int(session['otp']):
                registration_data = session.get('registration_data')
                if not registration_data:
                    return jsonify({
                        'success': False,
                        'error': 'Registration data not found. Please try registering again.'
                    })

                try:
                    db = get_db_connection()
                    cursor = db.cursor()
                    
                    if registration_data['user_type'] == 'Seller':
                        cursor.execute('''INSERT INTO pending_sellers 
                            (first_name, last_name, email, phone_number, address, password, user_type, valid_id, bir)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                            (registration_data['first_name'], registration_data['last_name'], 
                             session['email'], registration_data['phone_number'], 
                             registration_data['address'], registration_data['password'],
                             registration_data['user_type'], registration_data.get('valid_id_filename'),
                             registration_data.get('bir')))  # Add BIR to database insert
                        response_data = {
                            'success': True, 
                            'message': 'Your account is pending approval by the admin.'
                        }
                    else:
                        cursor.execute('''INSERT INTO user_accounts 
                            (first_name, last_name, email, phone_number, address, password, user_type)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                            (registration_data['first_name'], registration_data['last_name'], 
                             session['email'], registration_data['phone_number'], 
                             registration_data['address'], registration_data['password'],
                             registration_data['user_type']))
                        response_data = {
                            'success': True, 
                            'message': 'Registration successful.'
                        }
                    
                    db.commit()
                    
                    # Clear session data after successful registration
                    session.pop('registration_data', None)
                    session.pop('otp', None)
                    session.pop('email', None)
                    
                except mysql.connector.Error as err:
                    print(f"Database error: {err}")  # Debug print
                    return jsonify({
                        'success': False,
                        'error': f"Database error: {err}"
                    })
                finally:
                    cursor.close()
                    db.close()
                
                return jsonify(response_data)
            else:
                return jsonify({
                    'success': False,
                    'error': "Invalid OTP. Please try again."
                })
                
        except Exception as e:
            print(f"Exception: {str(e)}")  # Debug print
            return jsonify({
                'success': False,
                'error': f"An error occurred: {str(e)}"
            })

    return render_template('otp_verification.html')




@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']

    # Check for admin credentials
    if email == 'xendora@gmail.com' and password == 'xendora123':
        session['user_id'] = 0
        session['user_type'] = 'Admin'
        session['email'] = email
        return redirect(url_for('admins_dashboard'))

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        
        # First check if the account is in pending_sellers table
        cursor.execute('SELECT * FROM pending_sellers WHERE email = %s AND password = %s', (email, password))
        pending_seller = cursor.fetchone()
        
        if pending_seller:
            flash('Your account is pending approval from admin. Please wait for confirmation.', 'warning')
            return redirect(url_for('home'))

        # If not pending, check regular user_accounts
        cursor.execute('SELECT * FROM user_accounts WHERE email = %s AND password = %s', (email, password))
        user = cursor.fetchone()
        
        if user:
            # Store user info in session
            session['user_id'] = user['id']
            session['user_type'] = user['user_type']
            session['email'] = email
            session['address'] = user['address']

            # Redirect based on user_type
            if session['user_type'] == 'Buyer':
                return redirect(url_for('homepage'))
            elif session['user_type'] == 'Seller':
                return redirect(url_for('seller_dash'))
        else:
            flash('Email or Password is incorrect!', 'error')
            return redirect(url_for('home'))

    except mysql.connector.Error as err:
        flash(f"Error: {err}", 'error')
        return redirect(url_for('home'))
    finally:
        cursor.close()
        db.close()



@app.route('/seller')
def seller_page():
    # Ensure the user is logged in
    if 'user_id' not in session:
        return redirect(url_for('home'))  # Redirect to login if not logged in
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get pending orders count for the seller
        cursor.execute("""
            SELECT COUNT(*) as pending_count 
            FROM orders 
            WHERE seller_email = %s AND status != 'Received'
        """, (session.get('email'),))
        
        result = cursor.fetchone()
        pending_orders = result['pending_count'] if result else 0
        
        # Calculate total sales for the seller (only from 'Received' orders)
        cursor.execute("""
            SELECT SUM(total_price) as total_sales 
            FROM orders 
            WHERE seller_email = %s AND status = 'Received'
        """, (session.get('email'),))
        
        sales_result = cursor.fetchone()
        total_sales = float(sales_result['total_sales']) if sales_result['total_sales'] else 0.0
        
        # Calculate sales after 5% platform fee
        total_sales_after_fee = total_sales * 0.95
        
        return render_template('seller_dash.html', 
                             seller=seller, # type: ignore
                             pending_orders=pending_orders,
                             total_sales="{:.2f}".format(total_sales_after_fee))
        
    except Exception as e:
        print(f"Error: {str(e)}")
        flash("Error loading dashboard", "error")
        return redirect(url_for('home'))
        
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/seller_dash')
def dashboard_home():
    if 'user_id' not in session:
        return redirect(url_for('home'))
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get seller information with profile image
        cursor.execute("""
            SELECT id, first_name, last_name, email, phone_number, 
                   address, user_type, COALESCE(profile_image, 'default-profile.png') as profile_image
            FROM user_accounts 
            WHERE id = %s AND user_type = 'Seller'
        """, (session.get('user_id'),))
        seller = cursor.fetchone()
        
        if not seller:
            flash("Seller account not found", "error")
            return redirect(url_for('home'))
        
        # Get total sales
        cursor.execute("""
            SELECT SUM(total_price) as total_sales 
            FROM orders 
            WHERE seller_email = %s AND status = 'Received'
        """, (session.get('email'),))
        sales_result = cursor.fetchone()
        total_sales = float(sales_result['total_sales']) if sales_result['total_sales'] else 0.0
        
        # Get pending orders count
        cursor.execute("""
            SELECT COUNT(*) as pending_count 
            FROM orders 
            WHERE seller_email = %s AND status != 'Received'
        """, (session.get('email'),))
        result = cursor.fetchone()
        pending_orders = result['pending_count'] if result else 0
        
        # Get sales data for graph
        cursor.execute("""
            SELECT DATE(date) AS sale_date,
                   SUM(total_price) AS daily_sales,
                   COUNT(*) as orders_count
            FROM orders
            WHERE seller_email = %s 
              AND status = 'Received'
              AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(date)
            ORDER BY sale_date
        """, (session.get('email'),))
        sales_data = cursor.fetchall()
        
        # Prepare graph data
        dates = [str(item['sale_date']) for item in sales_data]
        daily_sales = [float(item['daily_sales']) for item in sales_data]
        orders_count = [int(item['orders_count']) for item in sales_data]
        
        return render_template('seller_dash.html', 
                             seller=seller,
                             total_sales="{:.2f}".format(total_sales),
                             pending_orders=pending_orders,
                             dates=dates,
                             daily_sales=daily_sales,
                             orders_count=orders_count)
                             
    except Exception as e:
        print(f"Error in dashboard: {str(e)}")
        flash("Error loading dashboard", "error")
        return redirect(url_for('home'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/register')
def register_page():
    return render_template('register.html')


@app.route('/sproduct')
def sproduct():
    return render_template('sproduct.html')

@app.route('/sellerdetails')
def sellerdetails():
    return render_template('sellerdetails.html')

@app.route('/add_new_product', methods=['GET', 'POST'])
def add_new_product():
    if 'email' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        try:
            # Get form data
            name = request.form['product_name']
            description = request.form['description']
            category = request.form['category']
            subcategory = request.form['subcategory']
            quantity = request.form['stock_quantity']
            price = request.form['regular_price']
            prod_id = request.form['prod_id']
            bir = request.form['bir']
            seller_email = session['email']  # Get seller's email from session

            # Handle image upload
            image = None
            if 'product_image' in request.files:
                file = request.files['product_image']
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    image = filename

            connection = get_db_connection()
            cursor = connection.cursor()

            # Check if product already exists
            cursor.execute("SELECT * FROM products WHERE prod_id = %s", (prod_id,))
            existing_product = cursor.fetchone()

            if existing_product:
                return render_template('AddNewProduct.html', error="Product already exists")

            # Insert new product with all necessary fields
            cursor.execute("""
                INSERT INTO products (
                    name, description, category, subcategory, 
                    quantity, price, prod_id, bir, 
                    seller_email, image, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                name, description, category, subcategory,
                quantity, price, prod_id, bir,
                seller_email, image, 1
            ))

            connection.commit()
            flash('Product added successfully!', 'success')
            return redirect(url_for('Allproducts'))

        except Exception as e:
            print(f"Error adding product: {e}")
            flash('Error adding product', 'error')
            return render_template('AddNewProduct.html', error=str(e))

        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()

    return render_template('AddNewProduct.html')


@app.route('/editproduct/<int:product_id>', methods=['GET', 'POST'])
def edit_product(product_id):
    user_email = session.get('email')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT * FROM products
        WHERE id = %s AND seller_email = %s
    """, (product_id, user_email))
    product = cursor.fetchone()

    if not product:
        flash("Product not found or you don't have permission to edit it.", "error")
        return redirect(url_for('Allproducts'))

    if request.method == 'POST':
        try:
            # Updated form field names to match AddNewProduct.html
            product_name = request.form['product_name']
            description = request.form['description']
            category = request.form['category']
            subcategory = request.form['subcategory']
            stock_quantity = request.form['stock_quantity']
            regular_price = request.form['regular_price']
            bir = request.form.get('bir', product['bir'])  # Keep existing BIR if not provided
            
            # Handle image upload
            image = request.files.get('product_image')
            image_filename = product['image']  # Default to current image

            if image and image.filename != '':
                if allowed_file(image.filename):
                    image_filename = secure_filename(image.filename)
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    image.save(image_path)
                else:
                    flash("Invalid image format. Allowed formats: png, jpg, jpeg, gif", "error")
                    return redirect(request.url)
            
            # Update the product in the database
            cursor.execute("""
                UPDATE products
                SET name = %s, category = %s, subcategory = %s, description = %s, 
                    quantity = %s, price = %s, image = %s, bir = %s
                WHERE id = %s
            """, (product_name, category, subcategory, description, 
                  stock_quantity, regular_price, image_filename, bir, product_id))
            
            connection.commit()
            flash("Product updated successfully!", "success")
            return redirect(url_for('Allproducts'))

        except Exception as e:
            print(f"Error updating product: {e}")
            flash(f"Error updating product: {str(e)}", "error")
            connection.rollback()
            
        finally:
            cursor.close()
            connection.close()

    return render_template('editproduct.html', product=product)





@app.route('/seller_dash', methods=['GET', 'POST'])
def seller_dash():
    if 'user_id' not in session or 'email' not in session:
        return redirect(url_for('home'))

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if request.method == 'POST':
            # Handle product addition
            try:
                # Get form data
                product_name = request.form['product_name']
                prod_id = request.form['prod_id']
                category = request.form['category']
                subcategory = request.form['subcategory']
                price = request.form['regular_price']
                quantity = request.form['stock_quantity']
                description = request.form['description']
                
                # Handle image upload
                image = None
                if 'product_image' in request.files:
                    file = request.files['product_image']
                    if file and allowed_file(file.filename):
                        filename = secure_filename(file.filename)
                        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        image = filename

                # Insert into database
                cursor.execute("""
                    INSERT INTO products (name, prod_id, category, subcategory, 
                                        price, quantity, description, image, 
                                        seller_email, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (product_name, prod_id, category, subcategory, price, 
                      quantity, description, image, session['email']))
                connection.commit()
                
                return jsonify({"success": True, "message": "Product added successfully"})
                
            except Exception as e:
                return jsonify({"success": False, "message": str(e)}), 400

        else:  # GET request
            # Get seller information
            cursor.execute("""
                SELECT id, fname, lname, email, contact, 
                       address, user_type, COALESCE(profile_image, 'default-profile.png') as profile_image
                FROM user_accounts 
                WHERE id = %s AND user_type = 'Seller'
            """, (session.get('user_id'),))
            seller = cursor.fetchone()

            # Get sales statistics
            cursor.execute("""
                SELECT SUM(total_price) as total_sales 
                FROM orders 
                WHERE seller_email = %s AND status = 'Received'
            """, (session.get('email'),))
            sales_result = cursor.fetchone()
            total_sales = float(sales_result['total_sales']) if sales_result['total_sales'] else 0.0

            # Get pending orders count
            cursor.execute("""
                SELECT COUNT(*) as pending_count 
                FROM orders 
                WHERE seller_email = %s AND status != 'Received'
            """, (session.get('email'),))
            result = cursor.fetchone()
            pending_orders = result['pending_count'] if result else 0

            return render_template('seller_dash.html',
                                seller=seller,
                                total_sales="{:.2f}".format(total_sales),
                                pending_orders=pending_orders)

    except Exception as e:
        print(f"Error in dashboard: {str(e)}")
        flash("Error loading dashboard", "error")
        return redirect(url_for('home'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/OrdersList')
def OrdersList():
    # Get the email of the logged-in seller
    seller_email = session.get('email')
    
    if not seller_email:
        flash('Please log in first', 'error')
        return redirect(url_for('home'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Query to get orders for this seller
        cursor.execute("""
            SELECT * FROM orders 
            WHERE seller_email = %s 
            ORDER BY date DESC
        """, (seller_email,))
        
        orders = cursor.fetchall()
        return render_template('OrdersList.html', orders=orders)
    
    except Exception as e:
        flash(f'Error fetching orders: {str(e)}', 'error')
        return redirect(url_for('seller_dash'))
    
    finally:
        cursor.close()
        connection.close()

@app.route('/Allproducts')
def Allproducts():
    if 'user_id' not in session:
        return redirect(url_for('home'))
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Debug information
        print(f"Debugging seller information:")
        print(f"Session user_id: {session.get('user_id')}")
        print(f"Session email: {session.get('email')}")
        
        # Get all products in database
        cursor.execute("SELECT id, name, seller_email FROM products")
        all_products = cursor.fetchall()
        print("\nAll products in database:")
        for product in all_products:
            print(f"ID: {product['id']}, Name: {product['name']}, Seller: {product['seller_email']}")
        
        # Get products for current seller
        query = """
            SELECT *
            FROM products
            WHERE seller_email = %s
            ORDER BY name ASC
        """
        print(f"\nQuery executed:\n{query}")
        print(f"\nWith seller_email: {session.get('email')}")
        
        cursor.execute(query, (session.get('email'),))
        products = cursor.fetchall()
        print(f"Number of products found: {len(products)}")
        
        return render_template('Allproducts.html', products=products)
        
    except Exception as e:
        print(f"Error loading products: {str(e)}")
        flash("Error loading products", "error")
        return redirect(url_for('home'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/logout')
def logout():
    # Clear the session or any user data
    session.pop('user_id', None)  # Clear the user ID from session
    session.pop('user_type', None)  # Clear the user type from session
    return render_template('login.html')



@app.route('/admin')
def admin_dashboard():
    search_email = request.args.get('search_email')  # Get the search email from the query parameter
    sort_by = request.args.get('sort')  # Get the sort value (seller or buyer)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Build the query based on whether a search or sort is provided
    if search_email:
        cursor.execute('SELECT * FROM user_accounts WHERE email LIKE %s', ('%' + search_email + '%',))
    elif sort_by == 'seller':
        cursor.execute('SELECT * FROM user_accounts WHERE user_type = "Seller"')
    elif sort_by == 'buyer':
        cursor.execute('SELECT * FROM user_accounts WHERE user_type = "Buyer"')
    else:
        cursor.execute('SELECT * FROM user_accounts')  # If no search or sort, fetch all users
    
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return render_template('admin_dashboard.html', users=users)

@app.route('/view_shop/<seller_email>')
def view_shop(seller_email):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get seller information
        cursor.execute("""
            SELECT *, COALESCE(profile_image, 'default-profile.jpg') as profile_image 
            FROM user_accounts 
            WHERE email = %s AND user_type = 'Seller'
        """, (seller_email,))
        seller = cursor.fetchone()
        
        if not seller:
            return "Seller not found", 404
            
        # Get seller's products
        cursor.execute("""
            SELECT * FROM products 
            WHERE seller_email = %s
        """, (seller_email,))
        products = cursor.fetchall()
        
        # Calculate total sales
        cursor.execute("""
            SELECT SUM(total_price) as total_sales 
            FROM orders 
            WHERE seller_email = %s AND status = 'Received'
        """, (seller_email,))
        sales = cursor.fetchone()
        total_sales = sales['total_sales'] if sales and sales['total_sales'] else 0
        
        return render_template('view_shop.html', 
                             seller=seller, 
                             seller_email=seller_email,
                             products=products, 
                             total_sales=total_sales)
                             
    except Exception as e:
        print(f"Error viewing shop: {str(e)}")
        return "Error loading shop", 500
    finally:
        cursor.close()
        connection.close()
 

@app.route('/pending_sellers', methods=['GET'])
def pending_sellers_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Retrieve the search query
    search_email = request.args.get('search_email', '')

    # Query the database based on search query
    if search_email:
        cursor.execute('SELECT * FROM pending_sellers WHERE email LIKE %s', (f"%{search_email}%",))
    else:
        cursor.execute('SELECT * FROM pending_sellers')
    
    sellers = cursor.fetchall()

    cursor.close()
    conn.close()
    return render_template('pending_sellers.html', sellers=sellers)

@app.route('/reject_seller/<int:seller_id>', methods=['POST'])
def reject_seller(seller_id):
    reason = request.form['reason']  # Capture the rejection reason
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # Use dictionary cursor

    # Get seller email to send rejection reason
    cursor.execute("SELECT email FROM pending_sellers WHERE id = %s", (seller_id,))
    seller = cursor.fetchone()  # This will now return a dictionary

    if seller:
        # Send the rejection reason via email
        msg = Message("Account Rejection Notice",
                      sender="admin@example.com",
                      recipients=[seller['email']])  # Access email as a dictionary key
        msg.body = f"Dear {seller['email']},\n\nYour account application has been rejected for the following reason:\n\n{reason}\n\nThank you."
        mail.send(msg)

        # Optionally, remove or archive the seller from the pending_sellers table
        cursor.execute("DELETE FROM pending_sellers WHERE id = %s", (seller_id,))
        conn.commit()
    
    cursor.close()
    conn.close()
    return redirect(url_for('pending_sellers_dashboard'))


@app.route('/approve/<int:seller_id>', methods=['POST'])
def approve_seller(seller_id):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Fetch seller details from pending_sellers
        cursor.execute('SELECT * FROM pending_sellers WHERE id = %s', (seller_id,))
        seller = cursor.fetchone()

        if seller:
            # Insert the seller into user_accounts
            cursor.execute('''INSERT INTO user_accounts (first_name, last_name, email, phone_number, address, password, user_type)
                              VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                           (seller['first_name'], seller['last_name'], seller['email'],
                            seller['phone_number'], seller['address'], seller['password'],
                            seller['user_type']))

            # Delete the seller from pending_sellers
            cursor.execute('DELETE FROM pending_sellers WHERE id = %s', (seller_id,))
            db.commit()
            flash('Seller approved successfully!', 'success')
        else:
            flash('Seller not found!', 'error')

        cursor.close()
        db.close()
    except mysql.connector.Error as err:
        flash(f"Database error: {err}", 'error')

    return redirect(url_for('pending_sellers_dashboard'))



@app.route('/update/<int:user_id>', methods=['GET', 'POST'])
def update_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'POST':
        # Fetch the form data
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        phone_number = request.form.get('phone_number')
        address = request.form.get('address')
        user_type = request.form.get('user_type')

        # Ensure all required fields are provided
        if not all([first_name, last_name, email, phone_number, address, user_type]):
            flash('All fields are required!', 'error')
            return redirect(url_for('admin_dashboard'))

        # Update the user in the database
        cursor.execute('''UPDATE user_accounts 
                          SET first_name=%s, last_name=%s, email=%s, phone_number=%s, address=%s, user_type=%s 
                          WHERE id=%s''', 
                       (first_name, last_name, email, phone_number, address, user_type, user_id))
        conn.commit()
        flash('User updated successfully!', 'success')
        cursor.close()
        conn.close()
        return redirect(url_for('admin_dashboard'))

    # If GET request, fetch user information
    cursor.execute('SELECT * FROM user_accounts WHERE id=%s', (user_id,))  # Changed from accounts to user_accounts
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    return render_template('update.html', user=user)
    

@app.route('/delete/<int:user_id>', methods=['POST'])
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM user_accounts WHERE id = %s', (user_id,))  # Changed from accounts to user_accounts
    conn.commit()
    cursor.close()
    conn.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/archive_accounts', methods=['GET'])
def archive_accounts():
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get the search query from the URL parameter
    search_email = request.args.get('search_email', '')

    # If there's a search query, filter the archived accounts by email
    if search_email:
        cursor.execute("SELECT * FROM archive WHERE email LIKE %s", (f"%{search_email}%",))
    else:
        cursor.execute("SELECT * FROM archive")  # Retrieve all archived accounts if no search

    archived_users = cursor.fetchall()

    conn.close()
    return render_template('archive.html', users=archived_users)


@app.route('/archive/<int:user_id>', methods=['POST'])
def archive_account(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Start transaction
        conn.start_transaction()
        
        # Retrieve the user to be archived
        cursor.execute("SELECT * FROM user_accounts WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user:
            # Archive or delete related records first
            user_email = user['email']
            
            # Handle cart items
            cursor.execute("DELETE FROM cart WHERE user_email = %s", (user_email,))
            
            # Handle wishlist items
            cursor.execute("DELETE FROM wishlist WHERE user_email = %s", (user_email,))
            
            # Handle orders (you might want to archive these instead of deleting)
            cursor.execute("UPDATE orders SET status = 'Archived' WHERE email = %s", (user_email,))
            
            # Insert the user into the archive table (removed archived_at field)
            cursor.execute("""
                INSERT INTO archive (id, first_name, last_name, password, email, 
                                   phone_number, address, user_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (user['id'], user['first_name'], user['last_name'], user['password'],
                  user['email'], user['phone_number'], user['address'], user['user_type']))
            
            # Delete the user from the user_accounts table
            cursor.execute("DELETE FROM user_accounts WHERE id = %s", (user_id,))
            
            # Commit the transaction
            conn.commit()
            flash("Account successfully archived.", "success")
        else:
            flash("User not found.", "error")
            
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        print(f"Error archiving account: {str(e)}")
        flash("Error archiving account. Please try again.", "error")
        
    finally:
        cursor.close()
        conn.close()
        
    return redirect(url_for('admin_dashboard'))

@app.route('/restore/<int:user_id>', methods=['POST'])
def restore_account(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Start transaction
        conn.start_transaction()

        # Fetch the archived user
        cursor.execute("SELECT * FROM archive WHERE id = %s", (user_id,))
        archived_user = cursor.fetchone()

        if not archived_user:
            flash("Archived user not found.", "error")
            return redirect(url_for('archive_accounts'))

        # Check if email already exists in user_accounts
        cursor.execute("SELECT id FROM user_accounts WHERE email = %s", (archived_user['email'],))
        existing_user = cursor.fetchone()

        if existing_user:
            flash("Cannot restore account: Email already exists in active accounts.", "error")
            return redirect(url_for('archive_accounts'))

        # Insert the user back into the user_accounts table
        cursor.execute("""
            INSERT INTO user_accounts 
            (first_name, last_name, password, email, phone_number, address, user_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            archived_user['first_name'],
            archived_user['last_name'],
            archived_user['password'],
            archived_user['email'],
            archived_user['phone_number'],
            archived_user['address'],
            archived_user['user_type']
        ))

        # Delete from archive table
        cursor.execute("DELETE FROM archive WHERE id = %s", (user_id,))
        
        # Commit the transaction
        conn.commit()
        flash("Account successfully restored.", "success")

    except Exception as e:
        conn.rollback()
        print(f"Error restoring account: {str(e)}")
        flash(f"Error restoring account: {str(e)}", "error")

    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('archive_accounts'))

@app.route('/upload_image', methods=['POST'])
def upload_image():
    # Check if the POST request has the file part
    if 'product_image' not in request.files:
        flash('No file part', 'error')
        return redirect(request.url)

    file = request.files['product_image']

    # If user does not select a file, browser submits an empty file without a filename
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(request.url)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return redirect(url_for('add_new_product'))

    flash('Invalid file format. Only jpg, jpeg, and png allowed.', 'error')
    return redirect(request.url)

@app.route('/view_product/<int:product_id>')
def view_product(product_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cursor.fetchone()
    cursor.close()
    db.close()

    if product:
        return render_template('view_product.html', product=product)
    else:
        flash('Product not found!', 'error')
        return redirect(url_for('lenses'))

@app.route('/cart')
def cart():
    if 'email' not in session:
        return redirect(url_for('home'))
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT c.*, p.image as product_image, p.name as product_name 
            FROM cart c
            LEFT JOIN products p ON c.prod_id = p.id
            WHERE c.email = %s
        """, (session['email'],))
        
        cart_items = cursor.fetchall()
        
        # Calculate totals
        total = 0
        for item in cart_items:
            item['price'] = float(item['price'])
            item['total'] = item['price'] * item['quantity']
            total += item['total']
            
        subtotal = total
        discount = subtotal * 0.25  # 25% discount
        final_total = subtotal - discount
            
        return render_template('cart.html', 
                             cart_items=cart_items,
                             subtotal=subtotal,
                             discount=discount,
                             final_total=final_total)
        
    except Exception as e:
        print(f"Error fetching cart: {str(e)}")
        return redirect(url_for('homepage'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/cart/delete_selected', methods=['POST'])
def delete_selected_items():
    selected_ids = request.json.get('ids', [])
    user_email = session.get('email')  # Kunin ang email ng user mula sa session

    if not selected_ids:
        return jsonify({'success': False, 'error': 'No IDs provided for deletion'}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    # Delete items from cart for the current user only
    format_strings = ','.join(['%s'] * len(selected_ids))
    cursor.execute(f'DELETE FROM cart WHERE id IN ({format_strings}) AND email = %s', tuple(selected_ids + [user_email]))
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({'success': True})

@app.route('/get_product_details/<int:product_id>')
def get_product_details(product_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Get product details with seller information and wishlist status
        cursor.execute("""
            SELECT p.*, u.first_name, u.last_name,
                   EXISTS(SELECT 1 FROM wishlist w 
                         WHERE w.product_id = p.id 
                         AND w.user_email = %s) as in_wishlist
            FROM products p
            JOIN user_accounts u ON p.seller_email = u.email
            WHERE p.id = %s
        """, (session.get('email'), product_id))
        
        product = cursor.fetchone()
        
        if product:
            # Convert decimal to float for JSON serialization
            if 'price' in product:
                product['price'] = float(product['price'])
            return jsonify(product)
        else:
            return jsonify({'error': 'Product not found'}), 404
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Server error'}), 500
        
    finally:
        cursor.close()
        connection.close()

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401
    
    try:
        user_email = session.get('email')
        print(f"Debug - User Email from session: {user_email}")  # Debug print
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # First verify if the user exists in user_accounts
        cursor.execute("SELECT email FROM user_accounts WHERE email = %s", (user_email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"Debug - User not found in database for email: {user_email}")  # Debug print
            return jsonify({'success': False, 'message': 'User account not found'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        # Get product details
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'})
        
        print(f"Debug - Product found: {product}")  # Debug print
        
        # Check if item already in cart
        cursor.execute("""
            SELECT * FROM cart 
            WHERE email = %s AND prod_id = %s
        """, (user['email'], product['id']))  # Using verified user email
        cart_item = cursor.fetchone()
        
        if cart_item:
            cursor.execute("""
                UPDATE cart 
                SET quantity = quantity + %s 
                WHERE email = %s AND prod_id = %s
            """, (quantity, user['email'], product['id']))
        else:
            cursor.execute("""
                INSERT INTO cart 
                (name, price, quantity, email, seller_email, prod_id, image) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                product['name'],
                product['price'],
                quantity,
                user['email'],  # Using verified user email
                product['seller_email'],
                product['id'],
                product['image']
            ))
        
        connection.commit()
        return jsonify({'success': True, 'message': 'Product added to cart successfully'})
        
    except Exception as e:
        print(f"Error adding to cart: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/toggle_wishlist', methods=['POST'])
def toggle_wishlist():
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    product_id = data.get('product_id')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Check if product exists
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Product not found'})
        
        # Check if product is already in wishlist
        cursor.execute("""
            SELECT * FROM wishlist 
            WHERE user_email = %s AND product_id = %s
        """, (session['email'], product_id))
        
        existing = cursor.fetchone()
        
        if existing:
            # Remove from wishlist
            cursor.execute("""
                DELETE FROM wishlist 
                WHERE user_email = %s AND product_id = %s
            """, (session['email'], product_id))
            message = 'Removed from wishlist'
            is_in_wishlist = False
        else:
            # Add to wishlist
            cursor.execute("""
                INSERT INTO wishlist (user_email, product_id) 
                VALUES (%s, %s)
            """, (session['email'], product_id))
            message = 'Added to wishlist'
            is_in_wishlist = True
        
        connection.commit()
        return jsonify({'success': True, 'message': message, 'in_wishlist': is_in_wishlist})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Error toggling wishlist'})
    finally:
        cursor.close()
        connection.close()

@app.route('/add-to-wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Check if product exists
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'})
        
        # Check if already in wishlist
        cursor.execute("""
            SELECT * FROM wishlist 
            WHERE user_id = %s AND product_id = %s
        """, (session['user_id'], product_id))
        
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Product already in wishlist'})
        
        # Add to wishlist
        cursor.execute("""
            INSERT INTO wishlist (user_id, product_id) 
            VALUES (%s, %s)
        """, (session['user_id'], product_id))
        
        connection.commit()
        return jsonify({'success': True, 'message': 'Product added to wishlist successfully'})
        
    except Exception as e:
        print(f"Error adding to wishlist: {str(e)}")
        return jsonify({'success': False, 'message': 'Error adding to wishlist'})
    finally:
        cursor.close()
        connection.close()

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, name, description, price, image, quantity as stock_quantity
            FROM products WHERE id = %s
        """, (product_id,))
        
        product = cursor.fetchone()
        
        if product:
            return jsonify(product)
        else:
            return jsonify({'error': 'Product not found'}), 404
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Server error'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/get_cart_count')
def get_cart_count():
    if 'email' not in session:
        return jsonify({'count': 0})
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Changed user_email to email to match the cart table structure
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM cart 
            WHERE email = %s
        """, (session['email'],))
        
        result = cursor.fetchone()
        return jsonify({'count': result['count'] if result else 0})
        
    except Exception as e:
        print(f"Error getting cart count: {str(e)}")
        return jsonify({'count': 0})
    finally:
        cursor.close()
        connection.close()

@app.route('/admins')
def admins_dashboard():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Get user counts
    cursor.execute("SELECT user_type, COUNT(*) as count FROM user_accounts GROUP BY user_type")
    user_counts = cursor.fetchall()

    total_buyers = 0
    total_sellers = 0

    for user_count in user_counts:
        if user_count['user_type'] == 'Buyer':
            total_buyers = user_count['count']
        elif user_count['user_type'] == 'Seller':
            total_sellers = user_count['count']

    # Calculate total sales (from orders marked as 'Received')
    cursor.execute("""
        SELECT COALESCE(SUM(total_price), 0) AS total_sales
        FROM orders
        WHERE status = 'Received'
    """)
    sales_result = cursor.fetchone()
    total_sales = float(sales_result['total_sales']) if sales_result['total_sales'] else 0

    # Calculate 5% platform sales fee (now using float)
    platform_sales = total_sales * 0.05

    cursor.close()
    connection.close()

    return render_template('admin.html', 
                         total_buyers=total_buyers, 
                         total_sellers=total_sellers,
                         platform_sales=platform_sales)

@app.route('/api/seller_contributions')
def seller_contributions():
    sort_order = request.args.get('sort', 'desc')  # Default to descending order
    search_query = request.args.get('search', '').lower()  # Get search query
    order_clause = "DESC" if sort_order == 'desc' else "ASC"

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Calculate seller contributions (5% of their total sales)
    query = f"""
        SELECT seller_email, SUM(total_price) * 0.05 AS total_contribution
        FROM orders
        WHERE status = 'Received'
        GROUP BY seller_email
    """

    # Filter by email if search query is provided
    if search_query:
        query += f" HAVING LOWER(seller_email) LIKE '%{search_query}%'"
    
    query += f" ORDER BY total_contribution {order_clause}"

    cursor.execute(query)
    sellers = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(sellers)






@app.route('/api/user_counts')
def user_counts():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT user_type, COUNT(*) as count FROM user_accounts GROUP BY user_type")
    data = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(data)



@app.route('/checkout_route', methods=['POST'])
def checkout_route():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401

    try:
        data = request.get_json()
        selected_ids = data.get('ids', [])
        
        if not selected_ids:
            return jsonify({'success': False, 'message': 'No items selected'}), 400
        
        # Store selected items in session for checkout page
        session['checkout_items'] = selected_ids
        
        return jsonify({
            'success': True,
            'redirect': url_for('checkout')
        })

    except Exception as e:
        print(f"Checkout Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error processing checkout'
        }), 500

@app.route('/checkout', methods=['POST'])
def checkout():
    if 'email' not in session:
        return redirect(url_for('home'))
    
    try:
        # Get selected items from form
        selected_items = request.form.getlist('cart_items')
        
        if not selected_items:
            flash('Please select items to checkout', 'error')
            return redirect(url_for('cart'))
            
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get selected cart items
        placeholders = ','.join(['%s'] * len(selected_items))
        cursor.execute(f"""
            SELECT c.*, p.image, p.name as product_name
            FROM cart c
            LEFT JOIN products p ON c.prod_id = p.id 
            WHERE c.id IN ({placeholders}) AND c.email = %s
        """, (*selected_items, session['email']))
        
        cart_items = cursor.fetchall()
        
        # Calculate total
        total_price = sum(float(item['price']) * item['quantity'] for item in cart_items)
        
        return render_template('checkout.html',
                             cart_items=cart_items,
                             total_price=total_price)
                             
    except Exception as e:
        print(f"Checkout error: {str(e)}")
        flash('Error processing checkout', 'error')
        return redirect(url_for('cart'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/return_to_cart', methods=['POST'])
def return_to_cart():
    selected_ids = request.json.get('ids')
    user_email = session.get('email')

    if not selected_ids:
        return jsonify(success=False, error="No items selected to return to the cart"), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        format_strings = ','.join(['%s'] * len(selected_ids))
        cursor.execute(
            f"SELECT id, name, price, quantity, variations, image, seller_email, prod_id FROM checkout WHERE id IN ({format_strings}) AND email = %s",
            tuple(selected_ids + [user_email]))
        checkout_items = cursor.fetchall()
        
        if not checkout_items:
            return jsonify(success=False, error="No items found to return to the cart"), 400

        for item in checkout_items:
            cursor.execute("""
                INSERT INTO cart (id, name, price, quantity, variations, image, email, seller_email, prod_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (item['id'], item['name'], item['price'], item['quantity'], item['variations'], item['image'], user_email, item['seller_email'], item['prod_id']))

        cursor.execute(
            f"DELETE FROM checkout WHERE id IN ({format_strings}) AND email = %s",
            tuple(selected_ids + [user_email]))

        connection.commit()
        return jsonify(success=True)

    except Exception as e:
        connection.rollback()
        return jsonify(success=False, error=str(e)), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/checkout/delete/<int:item_id>', methods=['POST'])
def delete_checkout_item(item_id):
    user_email = session.get('email')  # Kunin ang email mula sa session
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Delete item from the checkout table for the current user only
        cursor.execute("DELETE FROM checkout WHERE id = %s AND email = %s", (item_id, user_email))
        connection.commit()

        return jsonify({"success": True})
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({"success": False, "error": str(err)})
    finally:
        cursor.close()
        connection.close()

@app.route('/confirm_order', methods=['POST'])
def confirm_order():
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get cart items with seller information
        cursor.execute("""
            SELECT c.*, p.name, p.price, c.seller_email
            FROM cart c
            JOIN products p ON c.prod_id = p.id
            WHERE c.email = %s
        """, (session['email'],))
        
        cart_items = cursor.fetchall()
        if not cart_items:
            return jsonify({'success': False, 'message': 'Cart is empty'})
        
        # Calculate total
        total_amount = sum(float(item['price']) * item['quantity'] for item in cart_items)
        
        # Group items by seller
        for item in cart_items:
            # Create order with seller email
            cursor.execute("""
                INSERT INTO orders (email, seller_email, total_price, status, date, name)
                VALUES (%s, %s, %s, 'Pending', NOW(), %s)
            """, (
                session['email'],
                item['seller_email'],
                item['price'] * item['quantity'],
                item['name']
            ))
            
            order_id = cursor.lastrowid
            
            # Create order items
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['prod_id'], item['quantity'], item['price']))
            
            # Update product stock
            cursor.execute("""
                UPDATE products 
                SET quantity = quantity - %s 
                WHERE id = %s
            """, (item['quantity'], item['prod_id']))
        
        # Clear cart after successful order
        cursor.execute("DELETE FROM cart WHERE email = %s", (session['email'],))
        
        connection.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Order placed successfully!',
            'order_id': order_id,
            'redirect_url': url_for('order_success', order_id=order_id)
        })
        
    except Exception as e:
        connection.rollback()
        print(f"Error processing order: {str(e)}")
        return jsonify({'success': False, 'message': 'Error processing order'})
        
    finally:
        cursor.close()
        connection.close()
@app.route('/order_success/<int:order_id>')
def order_success(order_id):
    if 'email' not in session:
        return redirect(url_for('home'))
        
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Get order details
        cursor.execute("""
            SELECT o.*, oi.*, p.name as product_name, p.image
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = %s AND o.user_email = %s
        """, (order_id, session['email']))
        
        order_items = cursor.fetchall()
        
        if not order_items:
            flash('Order not found', 'error')
            return redirect(url_for('homepage'))
            
        return render_template('order_success.html', 
                             order_items=order_items,
                             order_id=order_id,
                             total=order_items[0]['total_amount'])
                             
    except Exception as e:
        print(f"Error fetching order: {str(e)}")
        return redirect(url_for('homepage'))
        
    finally:
        cursor.close()
        connection.close()






        
@app.route('/orders')
def orders():
    user_email = session.get('email')  # Get the email from the session
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Fetch orders for the current user only
    cursor.execute("SELECT * FROM orders WHERE email = %s", (user_email,))
    orders = cursor.fetchall()

    cursor.close()
    connection.close()
    return render_template('orders.html', orders=orders)

@app.route('/mark_as_received/<int:order_id>', methods=['POST'])
def mark_as_received(order_id):
    user_email = session.get('email')  # Get the email from the session
    connection = get_db_connection()

    try:
        # Step 1: Update the status to "Received" for the current user's order
        cursor = connection.cursor(dictionary=True)  # Ensure cursor returns results as a dictionary
        cursor.execute(
            "UPDATE orders SET status = 'Received' WHERE id = %s AND email = %s",
            (order_id, user_email))
        connection.commit()

        # Step 2: Retrieve the order details (prod_id and quantity)
        cursor.execute(
            "SELECT prod_id, quantity FROM orders WHERE id = %s AND email = %s",
            (order_id, user_email))
        order = cursor.fetchone()

        if order:
            prod_id = order['prod_id']
            quantity = int(order['quantity'])  # Make sure quantity is an integer

            # Step 3: Decrease the product quantity in the products table
            cursor.execute(
                "UPDATE products SET quantity = quantity - %s WHERE prod_id = %s",
                (quantity, prod_id))
            connection.commit()

        flash("Order has been marked as received and inventory updated.", "success")
        return redirect(url_for('orders'))  # Add this line to return to orders page
        
    except Exception as e:
        connection.rollback()  # Rollback on error
        flash(f"An error occurred: {str(e)}", "danger")
        return redirect(url_for('orders'))  # Add this line to return to orders page in case of error
        
    finally:
        cursor.close()
        connection.close()

@app.route('/delete_order/<int:order_id>', methods=['POST'])
def delete_order(order_id):
    if 'email' not in session:
        flash('Please login first', 'error')
        return redirect(url_for('login'))

    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # First delete related order_items
        cursor.execute("""
            DELETE FROM order_items 
            WHERE order_id = %s
        """, (order_id,))
        
        # Then delete the order
        cursor.execute("""
            DELETE FROM orders 
            WHERE id = %s AND email = %s
        """, (order_id, session['email']))
        
        connection.commit()
        
        if cursor.rowcount > 0:
            flash('Order cancelled successfully', 'success')
        else:
            flash('Order not found or you do not have permission to cancel it', 'warning')
            
        return redirect(url_for('orders'))
        
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error deleting order: {str(e)}")  # Add debug print
        flash(f'Error cancelling order: {str(e)}', 'error')
        return redirect(url_for('orders'))
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
        return redirect(url_for('orders'))

@app.route('/update_order_status/<int:order_id>', methods=['POST'])
def update_order_status(order_id):
    status = request.form['stat']
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
    connection.commit()
    cursor.close()
    connection.close()
    return redirect(url_for('OrdersList'))

@app.route('/update_order_received_status', methods=['POST'])
def update_order_received_status():
    data = request.json
    order_id = data.get('order_id')  # Get the order ID
    status = data.get('status')  # Get the status (should be 'Received')
    prod_id = data.get('prod_id')  # Get the prod_id for reference
    quantity_received = data.get('quantity')  # Get the quantity of the received item
    user_email = session.get('email')  # Get the email from session (if needed)

    if status != 'Received':
        return jsonify({'success': False, 'error': 'Invalid status'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Step 1: Update the order status to 'Received'
        cursor.execute("""
            UPDATE orders
            SET status = %s
            WHERE id = %s AND email = %s
        """, (status, order_id, user_email))

        # Step 2: Get the current quantity of the product from the products table using prod_id
        cursor.execute("""
            SELECT quantity FROM products WHERE prod_id = %s
        """, (prod_id,))
        product = cursor.fetchone()

        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404

        current_quantity = int(product['quantity'])

        # Step 3: Subtract the received quantity from the product quantity
        new_quantity = current_quantity - int(quantity_received)

        # Step 4: Update the product's quantity in the products table
        cursor.execute("""
            UPDATE products
            SET quantity = %s
            WHERE prod_id = %s
        """, (new_quantity, prod_id))

        conn.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/wishlist')
def wishlist():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Get the user's email from the session
        user_email = session.get('email')
        
        # Fetch wishlist items for the current user
        cursor.execute("""
            SELECT w.*, p.name, p.price, p.image, p.description 
            FROM wishlist w 
            JOIN products p ON w.product_id = p.id 
            WHERE w.user_email = %s
        """, (user_email,))
        
        wishlist_items = cursor.fetchall()
        return render_template('wishlist.html', wishlist_items=wishlist_items)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

# Add these API endpoints for wishlist functionality
@app.route('/move-to-cart', methods=['POST'])
def move_to_cart():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    product_id = data.get('product_id')
    user_email = session.get('email')
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # First, get the product details
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'})
        
        # Add to cart
        cursor.execute("""
            INSERT INTO cart (name, price, quantity, image, email, seller_email, prod_id)
            VALUES (%s, %s, 1, %s, %s, %s, %s)
        """, (product['name'], product['price'], product['image'], 
              user_email, product['seller_email'], product['prod_id']))
        
        # Remove from wishlist
        cursor.execute("""
            DELETE FROM wishlist 
            WHERE user_email = %s AND product_id = %s
        """, (user_email, product_id))
        
        connection.commit()
        return jsonify({'success': True})
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        connection.close()

@app.route('/remove-from-wishlist', methods=['POST'])
def remove_from_wishlist():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    product_id = data.get('product_id')
    user_email = session.get('email')
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM wishlist 
            WHERE user_email = %s AND product_id = %s
        """, (user_email, product_id))
        
        connection.commit()
        return jsonify({'success': True})
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        connection.close()

@app.route('/remove-selected-wishlist', methods=['POST'])
def remove_selected_wishlist():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'})
    
    data = request.get_json()
    product_ids = data.get('ids', [])
    user_email = session.get('email')
    
    if not product_ids:
        return jsonify({'success': False, 'message': 'No items selected'})
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        # Delete multiple items at once
        cursor.execute("""
            DELETE FROM wishlist 
            WHERE user_email = %s AND product_id IN ({})
        """.format(','.join(['%s'] * len(product_ids))), 
        (user_email, *product_ids))
        
        connection.commit()
        return jsonify({'success': True})
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        connection.close()

@app.route('/get_wishlist_count')  # Changed from /wishlist-count
def get_wishlist_count():
    if 'user_id' not in session:
        return jsonify({'count': 0})
    
    connection = get_db_connection()
    cursor = connection.cursor()
    
    try:
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM wishlist 
            WHERE user_id = %s
        """, (session['user_id'],))
        result = cursor.fetchone()
        return jsonify({'count': result[0] if result else 0})
    finally:
        cursor.close()
        connection.close()

@app.route('/api/featured-products')
def get_featured_products():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT p.*, 
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(r.id) as review_count
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.is_featured = 1
            GROUP BY p.id
            LIMIT 8
        """)
        products = cursor.fetchall()
        return jsonify(products)
    finally:
        cursor.close()
        connection.close()

@app.route('/api/new-releases')
def get_new_releases():
    seven_days_ago = datetime.now() - timedelta(days=7)
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT p.*, 
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(r.id) as review_count
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.created_at >= %s
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 8
        """, (seven_days_ago,))
        products = cursor.fetchall()
        return jsonify(products)
    finally:
        cursor.close()
        connection.close()

# Remove or update the get_categories route
@app.route('/get_categories')
def get_categories():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Instead of querying a separate categories table,
        # get distinct categories from the products table
        cursor.execute("""
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL 
            AND category != ''
            ORDER BY category
        """)
        categories = cursor.fetchall()
        return jsonify([category['category'] for category in categories])
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify([])
    
    finally:
        cursor.close()
        connection.close()

@app.route('/update_profile_pic', methods=['POST'])
def update_profile_pic():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Please login first'}), 401

    if 'profile_image' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400

    file = request.files['profile_image']

    # If user does not select a file, browser submits an empty file without a filename
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        try:
            # Generate a unique filename using timestamp and random string
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            random_string = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
            filename = f"profile_{timestamp}_{random_string}_{secure_filename(file.filename)}"
            
            # Save the file
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
            # Update database with new profile image
            connection = get_db_connection()
            cursor = connection.cursor()
            cursor.execute(
                "UPDATE user_accounts SET profile_image = %s WHERE id = %s",
                (filename, session['user_id']))
            connection.commit()
            
            # Create the correct relative path for the image URL
            image_url = url_for('static', filename=f'uploads/{filename}')
            
            return jsonify({
                'success': True,
                'message': 'Profile picture updated successfully',
                'image_url': image_url
            })
            
        except Exception as e:
            print(f"Error updating profile picture: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'connection' in locals():
                connection.close()
    
    return jsonify({'success': False, 'message': 'Invalid file type'}), 400

# Category routes - Add these near the top of your file, after app configuration
# ... existing code ...
@app.route('/cameralenses')
def cameralenses():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, u.first_name as seller_name 
            FROM products p 
            JOIN user_accounts u ON p.seller_email = u.email 
            WHERE p.category = 'Camera Lenses'
            ORDER BY p.created_at DESC
        """)
        products = cursor.fetchall()
        
        return render_template('cameralenses.html', products=products)
    except Exception as e:
        print(f"Error: {str(e)}")
        flash("Error loading products", "error")
        return redirect(url_for('homepage'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
        connection.close()

@app.route('/audio_equipment')
def audio_equipment():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT p.*, 
                   COALESCE(AVG(r.rating), 0) as avg_rating,
                   COUNT(r.id) as review_count
            FROM products p 
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.category = 'AUDIO EQUIPMENT'
            GROUP BY p.id
        """)
        products = cursor.fetchall()
        
        # Process each product
        for product in products:
            # Convert Decimal to float
            if 'avg_rating' in product:
                product['avg_rating'] = float(product['avg_rating'])
            if 'price' in product:
                product['price'] = float(product['price'])
            
            # Verify image exists
            if product['image']:
                image_path = os.path.join('static', 'uploads', 'products', product['image'])
                if not os.path.exists(image_path):
                    product['image'] = None
        
        return render_template('audio_equipment.html', products=products)
    except Exception as e:
        print(f"Error: {str(e)}")
        return redirect(url_for('homepage'))
    finally:
        cursor.close()
        connection.close()

@app.route('/lighting_studio')
def lighting_studio():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT p.*, u.first_name as seller_name 
            FROM products p 
            JOIN user_accounts u ON p.seller_email = u.email 
            WHERE p.category = 'Lighting & Studio'
            ORDER BY p.created_at DESC
        """)
        products = cursor.fetchall()
        
        # Process each product to ensure valid image paths
        for product in products:
            product['image_url'] = get_product_image_url(product.get('image'))
            
        return render_template('lighting_studio.html', products=products)
    except Exception as e:
        print(f"Error: {str(e)}")
        return redirect(url_for('homepage'))
    finally:
        cursor.close()
        connection.close()

@app.route('/accessories')
def accessories():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT p.*, u.first_name as seller_name 
            FROM products p 
            JOIN user_accounts u ON p.seller_email = u.email 
            WHERE p.category = 'Accessories'
            ORDER BY p.created_at DESC
        """)
        products = cursor.fetchall()
        return render_template('accessories.html', products=products)
    finally:
        cursor.close()
        connection.close()

# Add API route for camera lenses filtering and searching
@app.route('/api/products/lenses')
def get_lenses():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    sort_by = request.args.get('sort', 'featured')
    brand = request.args.get('brand', 'all')
    search = request.args.get('search', '')
    
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        query = """
            SELECT p.*, u.first_name as seller_name 
            FROM products p 
            JOIN user_accounts u ON p.seller_email = u.email 
            WHERE p.category = 'Camera Lenses'
        """
        params = []
        
        if brand != 'all':
            query += " AND p.brand = %s"
            params.append(brand)
            
        if search:
            query += " AND (p.name LIKE %s OR p.description LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
            
        if sort_by == 'price-low':
            query += " ORDER BY p.price ASC"
        elif sort_by == 'price-high':
            query += " ORDER BY p.price DESC"
        elif sort_by == 'newest':
            query += " ORDER BY p.created_at DESC"
        else:  # featured
            query += " ORDER BY p.is_featured DESC, p.created_at DESC"
            
        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # Convert decimal values to float for JSON serialization
        for product in products:
            if 'price' in product:
                product['price'] = float(product['price'])
                
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/cameras')
def cameras():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, u.first_name as seller_name 
            FROM products p 
            JOIN user_accounts u ON p.seller_email = u.email 
            WHERE p.category = 'Cameras'
            ORDER BY p.created_at DESC
        """)
        products = cursor.fetchall()
        
        return render_template('cameras.html', products=products)
    except Exception as e:
        print(f"Error: {str(e)}")
        flash("Error loading products", "error")
        return redirect(url_for('homepage'))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

@app.route('/seller-dashboard')
def seller_dashboard():
    if 'email' not in session:
        return redirect(url_for('login'))
    return render_template('sellerdetails.html')

@app.template_filter('product_image')
def product_image_filter(image_path):
    if not image_path:
        return url_for('static', filename='images/default-product.jpg')
    
    # Check if the image file exists
    full_path = os.path.join(app.static_folder, 'images', image_path)
    if not os.path.exists(full_path):
        return url_for('static', filename='images/default-product.jpg')
        
    return url_for('static', filename=f'images/{image_path}')

@app.route('/api/categories')
def api_categories():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT DISTINCT category 
            FROM products 
            WHERE category IS NOT NULL 
            AND category != ''
            ORDER BY category
        """)
        categories = cursor.fetchall()
        return jsonify([category['category'] for category in categories])
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify([])
    finally:
        cursor.close()
        connection.close()

# Add this function near the top of your file
def ensure_default_image_exists():
    default_image_path = os.path.join('static', 'images', 'products', 'no-image.png')
    if not os.path.exists(default_image_path):
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(default_image_path), exist_ok=True)
        
        # Create a simple default image
        img = Image.new('RGB', (300, 300), color='#f0f0f0')
        img.save(default_image_path)

# Replace before_first_request with before_request
@app.before_request
def initialize_app():
    if not hasattr(app, '_default_image_created'):
        ensure_default_image_exists()
        app._default_image_created = True

# Update your product image handling function
def get_product_image_url(image_path):
    if not image_path:
        return url_for('static', filename='images/products/no-image.png')
    
    full_path = os.path.join('static', 'uploads', 'products', image_path)
    if not os.path.exists(full_path):
        return url_for('static', filename='images/products/no-image.png')
        
    return url_for('static', filename=f'uploads/products/{image_path}')

if __name__ == '__main__':
    app.run(debug=True)