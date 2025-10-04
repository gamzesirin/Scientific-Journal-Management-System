# AI-Powered Journal Management System

A modern scientific journal management system built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## 🌟 Features

- 👥 Multi-role user system (Admin, Editor, Reviewer, Author)
- 📝 Paper submission and management
- 👨‍💼 Editor assignment and review process
- 👨‍⚖️ Reviewer dashboard and evaluation
- 📊 Status tracking and notifications
- 🤖 AI-powered reviewer suggestions (Coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/journal-management.git
   cd journal-management
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📁 Project Structure

```
journal-management/
├── app/                # Next.js app directory
│   ├── actions/       # Server actions
│   ├── api/          # API routes
│   └── (routes)/     # Page components
├── components/        # Reusable components
├── lib/              # Utilities and helpers
│   ├── supabase/    # Supabase client
│   └── utils/       # Helper functions
└── public/           # Static assets
```

## 🔐 Authentication

The system uses Supabase Auth with email/password and supports four user roles:

- **Admin**: System management
- **Editor**: Paper review management
- **Reviewer**: Paper evaluation
- **Author**: Paper submission

## 📝 Database Schema

Key tables in the system:

- `users`: User profiles and roles
- `papers`: Submitted papers
- `assignments`: Reviewer assignments
- `reviews`: Paper reviews
- `decisions`: Editorial decisions

## 🗄️ Storage

- `papers`: Private bucket for PDF submissions
- `avatars`: Public bucket for user avatars

## 🛣️ Roadmap

Check [ROADMAP.md](ROADMAP.md) for detailed development plan and progress.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the powerful backend platform
- All contributors who help improve the system
