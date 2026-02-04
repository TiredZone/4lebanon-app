# Authentication & Article Management System - Testing Guide

## ✅ System Overview

Your 4Lebanon news website now has a complete authentication and article management system:

### **Features Implemented:**

1. ✅ **User Signup Page** (`/admin/signup`)
2. ✅ **User Login Page** (`/admin/login`)
3. ✅ **User Menu in Navigation** (top-right corner)
4. ✅ **Article Creation System** (`/admin/articles/new`)
5. ✅ **Database Integration** (Articles saved to Supabase)
6. ✅ **Section/Category Selection** (Articles appear in correct sections)
7. ✅ **Authentication Protection** (Admin pages require login)

---

## 🚀 Testing Instructions

### **Step 1: Create a New Account**

1. Open your browser and go to: `http://localhost:3000`
2. Look at the top navigation bar (red bar below the header)
3. Click the **"تسجيل الدخول"** (Login) button on the right side
4. On the login page, click **"إنشاء حساب جديد"** (Create New Account)
5. Fill in the signup form:
   - **الاسم الكامل** (Full Name): Enter your name (e.g., "أحمد محمد")
   - **البريد الإلكتروني** (Email): Enter your email (e.g., "test@example.com")
   - **كلمة المرور** (Password): Enter a password (minimum 6 characters)
   - **تأكيد كلمة المرور** (Confirm Password): Re-enter the same password
6. Click **"إنشاء حساب"** (Create Account)
7. You should see a success message and be redirected to the login page

### **Step 2: Log In**

1. On the login page, enter your credentials:
   - Email address
   - Password
2. Click **"تسجيل الدخول"** (Login)
3. You should be redirected to `/admin` (Admin Dashboard)
4. Check the navigation bar - you should now see your username and a dropdown menu

### **Step 3: Create a New Article**

1. From the admin dashboard, click **"مقال جديد"** (New Article)
   - OR use the user menu dropdown → "مقال جديد"
   - OR go directly to: `http://localhost:3000/admin/articles/new`

2. Fill in the article form:

   **Main Content (Left Side):**
   - **العنوان** (Title): Enter article title (e.g., "خبر عاجل من بيروت")
   - **الملخص** (Summary): Brief summary (optional)
   - **محتوى المقال** (Article Body): Write your article content

   **Sidebar (Right Side):**

   **Publishing Settings:**
   - **الحالة** (Status): Choose from:
     - `مسودة` (Draft) - Not published
     - `منشور` (Published) - Live on website
     - `مجدول` (Scheduled) - Publish later
   - **تاريخ النشر** (Publish Date): Set date/time if scheduling
   - **☑ خبر عاجل** (Breaking News): Check this for breaking news
   - **☑ مقال مميز** (Featured Article): Check this for important/featured articles

   **Cover Image:**
   - Click "Choose File" to upload an image
   - Wait for "تم رفع الصورة بنجاح" (Upload successful) message

   **Categories (التصنيف):**
   - **القسم** (Section): **IMPORTANT!** Choose where article appears:
     - `رادار` (Radar) → Shows in "رادار" section on homepage
     - `بحث وتحرّي` (Investigation) → Shows in "بحث وتحرّي" section
     - `خاص` (Special) → Shows in "خاص" section
     - `المحليّة` (Local) → Local news
     - `أمن وقضاء` (Security) → Security & judiciary
     - `إقليمي ودولي` (Regional) → Regional/international
     - `اقتصاد` (Economy) → Economics
   - **المنطقة** (Region): Optional geographic classification
   - **الدولة** (Country): Optional country selection

3. Click **"إنشاء المقال"** (Create Article)

4. You should see **"تم حفظ المقال بنجاح"** (Article saved successfully)

### **Step 4: Verify Article Appears on Website**

1. Go back to the homepage: `http://localhost:3000`
2. Check if your article appears based on what you selected:
   - If **"خبر عاجل"** was checked → Appears in المانشيت banner (red bar at top)
   - If **"مقال مميز"** was checked → Appears in "الأخبار المهمة" section
   - If section = **"رادار"** → Appears in رادار section
   - If section = **"بحث وتحرّي"** → Appears in بحث وتحرّي section
   - If section = **"خاص"** → Appears in خاص section
3. All published articles also appear in **"على مدار الساعة"** (Recent timeline)
4. Click on your article to view it: `/article/your-article-slug`

### **Step 5: Edit an Article**

1. Go to admin dashboard: `http://localhost:3000/admin`
2. Find your article in the list
3. Click "تعديل" (Edit)
4. Make changes
5. Click **"حفظ التغييرات"** (Save Changes)
6. Check homepage to see updates

### **Step 6: Test User Menu Features**

1. Click your username in the top-right navigation
2. You should see a dropdown menu with:
   - **لوحة التحكم** (Dashboard) → Go to admin panel
   - **مقال جديد** (New Article) → Create article quickly
   - **تسجيل الخروج** (Logout) → Sign out
3. Test each option

---

## 🔍 Database Verification

### **Check if Articles are in Database:**

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click "Table Editor" in sidebar
4. Select "articles" table
5. You should see your newly created articles with:
   - `title_ar`: Your article title
   - `section_id`: The section you selected
   - `author_id`: Your user ID
   - `is_breaking`: true/false based on checkbox
   - `is_featured`: true/false based on checkbox
   - `status`: published/draft/scheduled
   - `published_at`: Publication timestamp

### **Check User Profile:**

1. In Supabase Table Editor, select "profiles" table
2. Find your user record
3. Verify `display_name_ar` matches what you entered during signup

---

## 🎯 Article Types & Where They Appear

| Article Type          | Configuration          | Where It Shows                                                                                     |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Breaking News**     | ☑ خبر عاجل             | • المانشيت banner (red scrolling banner)<br>• الأخبار المهمة section<br>• على مدار الساعة timeline |
| **Featured Article**  | ☑ مقال مميز            | • الأخبار المهمة section (with image)<br>• Important news page `/important`                        |
| **Radar Articles**    | Section = "رادار"      | • رادار section on homepage<br>• Radar page `/section/radar`                                       |
| **Investigation**     | Section = "بحث وتحرّي" | • بحث وتحرّي section<br>• Investigation page `/section/investigation`                              |
| **Special/Exclusive** | Section = "خاص"        | • خاص section (large featured + side articles)<br>• Special page `/section/special`                |
| **Local News**        | Section = "المحليّة"   | • Local news page `/section/local`                                                                 |
| **Recent News**       | Any published article  | • على مدار الساعة sidebar<br>• Recent page `/recent`                                               |

---

## 🛠️ Troubleshooting

### **Problem: Can't log in**

- **Solution**:
  - Check email/password are correct
  - Verify account was created (check Supabase auth.users table)
  - Check browser console for errors (F12 → Console tab)

### **Problem: Article doesn't appear on website**

- **Solution**:
  - Ensure status = "منشور" (Published), not "مسودة" (Draft)
  - Check if article has a section selected
  - Refresh homepage (Ctrl+F5 for hard refresh)
  - Wait 2 minutes (page has 120s cache revalidation)

### **Problem: Upload image fails**

- **Solution**:
  - Check image file size (should be < 5MB)
  - Verify Supabase storage bucket "article-images" exists
  - Check storage policies allow authenticated uploads

### **Problem: "يجب تسجيل الدخول" error**

- **Solution**:
  - You were logged out - go to `/admin/login` and log in again
  - Check if your session expired

---

## 📊 Quick Test Checklist

- [ ] ✅ Sign up new account successfully
- [ ] ✅ Log in with created account
- [ ] ✅ User menu appears in navigation
- [ ] ✅ Access admin dashboard (`/admin`)
- [ ] ✅ Create new article with title
- [ ] ✅ Upload cover image
- [ ] ✅ Select section (e.g., "رادار")
- [ ] ✅ Check "خبر عاجل" for breaking news
- [ ] ✅ Check "مقال مميز" for featured
- [ ] ✅ Set status to "منشور" (Published)
- [ ] ✅ Click "إنشاء المقال" (Create)
- [ ] ✅ See success message
- [ ] ✅ Article appears on homepage in correct section
- [ ] ✅ Article viewable at `/article/[slug]`
- [ ] ✅ Edit article and save changes
- [ ] ✅ Log out from user menu
- [ ] ✅ Log back in successfully

---

## 🎉 Success Indicators

**Everything is working correctly if:**

1. ✅ You can create an account and log in
2. ✅ Your name appears in the navigation user menu
3. ✅ You can access `/admin/articles/new` without redirect
4. ✅ Article form saves successfully with "تم حفظ المقال بنجاح" message
5. ✅ Your article appears on the homepage in the section you selected
6. ✅ Article shows with correct title, image, and content
7. ✅ Breaking news articles appear in المانشيت banner
8. ✅ Featured articles appear in الأخبار المهمة section
9. ✅ All published articles appear in على مدار الساعة timeline
10. ✅ You can view individual article page by clicking on it

---

## 🌐 Current Server Status

**Development Server Running:**

- URL: `http://localhost:3000`
- Pages Available:
  - Homepage: `/`
  - Login: `/admin/login`
  - Signup: `/admin/signup`
  - Admin Dashboard: `/admin`
  - New Article: `/admin/articles/new`
  - Recent News: `/recent`
  - Important News: `/important`
  - All Sections: `/section/[slug]`

---

## 💡 Tips

1. **Always select a section** when creating articles - this determines where they appear
2. **Use "خبر عاجل"** for breaking news to make them prominent
3. **Use "مقال مميز"** for important stories you want featured
4. **Upload images** for better visual appeal (especially for featured articles)
5. **Write clear titles** - they appear in multiple places
6. **Check homepage immediately** after publishing to verify article appears

---

**Ready to test! Start at Step 1 above.** 🚀
