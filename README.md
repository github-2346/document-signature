# 📄 Document Signature 

A full-stack digital document signing platform that allows users to upload PDF documents, place signatures visually, embed them into the PDF, and download signed files.

This project is built with a modern **React + Spring Boot + PostgreSQL** architecture and simulates a real-world digital signature workflow similar to professional e-signature platforms.


## 🚀 Features

### 📂 Document Management
- Upload PDF documents
- Secure backend file storage
- Preview PDFs directly inside the browser
- Multi-user document tracking

### ✍️ Signature System
- Draw signature
- Type signature
- Upload image signature
- Drag & position signatures visually
- Resize and place signatures dynamically

## 🏗️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- react-pdf (PDF rendering)
- Zustand (State Management)
- Tailwind CSS

### Backend
- Spring Boot (Java 17)
- Spring Web
- Spring Data JPA
- PostgreSQL
- iText PDF / PDFBox (PDF processing)

### Database
- PostgreSQL

## 📁 Project Structure

```
Document_Signature/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── components/
│   │   └── types/
│
├── backend/
│   ├── src/main/java/com/docsign/
│   │   ├── controller/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── dto/
│   │   └── service/
│   │
│   ├── uploads/
│   └── signed/
│
└── README.md
```

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/github-2346/document-signature.git
cd Document_Signature
```

### 2️⃣  Install Dependencies

npm install

### 3️⃣ Start the Development Server

npm run dev

### 4️⃣ Open the Application

After starting, you will see something like:

Local: http://localhost:5173


## 🔄 Application Workflow

1. User uploads PDF document
2. Backend stores document file
3. Frontend requests preview from backend
4. User places signatures visually
5. Signature data sent to backend
6. Backend embeds signatures into PDF
7. Signed PDF becomes downloadable


## 📌 Current Status

✔ Real backend PDF preview  
✔ Signature embedding inside PDF  
✔ Signed PDF download working  
✔ Full-stack integration completed  


## 🛠 Future Improvements

- Multi-page signing support
- Cloud storage (AWS S3 / Firebase)
- Role-based permissions
- Audit trail system
