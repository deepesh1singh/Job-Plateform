# JobConnect Platform

A comprehensive job search and recruitment platform connecting job seekers with employers. Built with modern web technologies, JobConnect provides a seamless experience for both candidates looking for their next opportunity and companies seeking top talent.

## Overview

JobConnect is a full-stack job platform that enables:

### For Job Seekers
- Browse and search for job listings
- Create and manage professional profiles
- Apply to jobs with a single click
- Track application status
- Receive job recommendations based on skills and preferences

### For Employers/Recruiters
- Post and manage job listings
- Review and filter applications
- Search and connect with potential candidates
- Schedule interviews
- Manage hiring pipeline

### For Administrators
- Manage platform users and permissions
- Monitor platform activity and analytics
- Handle content moderation
- Configure system settings

## Features

- **Frontend**:
  - Built with React 18 and TypeScript
  - Styled with Tailwind CSS
  - Radix UI components for accessible UI elements
  - React Query for server state management
  - Form handling with React Hook Form

- **Backend**:
  - Node.js with Express
  - TypeScript for type safety
  - RESTful API architecture
  - MongoDB integration (Mongoose)
  - File uploads handling

- **Developer Experience**:
  - Vite for fast development server and builds
  - TypeScript across the entire stack
  - Environment configuration support
  - Database migrations with Drizzle

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MongoDB (for database)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rest-express
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   NODE_ENV=development
   ```

## Running the Application

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```
   This will start both the frontend (on port 5000) and backend servers with hot-reload enabled.

2. Open [http://localhost:5000](http://localhost:5000) in your browser.

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Testing

Run the type checker:
```bash
npm run check
```

## Database

This project uses MongoDB with Mongoose ODM. Database migrations are handled by Drizzle.

### Database Migrations

To apply database schema changes:
```bash
npm run db:push
```

## Project Structure

```
/
├── client/              # Frontend React application
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── storage.ts       # File storage handling
├── shared/              # Shared code between frontend and backend
├── components.json      # UI components configuration
├── package.json         # Project dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vite](https://vitejs.dev/) for the amazing build tooling
- [Radix UI](https://www.radix-ui.com/) for accessible UI primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [React Query](https://tanstack.com/query) for server state management

---
