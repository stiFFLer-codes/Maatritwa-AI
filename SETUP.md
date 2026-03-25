# Maatritwa AI - Setup Guide

Complete step-by-step guide to set up the development environment for Maatritwa AI.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Download Link |
|-------------|---------|---------------|
| Node.js | 18.x or higher | [Download](https://nodejs.org/) |
| npm | 9.x or higher | Included with Node.js |
| Git | Latest | [Download](https://git-scm.com/) |
| VS Code (recommended) | Latest | [Download](https://code.visualstudio.com/) |

### Verify Installations

Open your terminal/command prompt and run:

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
# Expected: 2.x.x or higher
```

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project folder
cd Maatritwa-AI
```

### Step 2: Install Dependencies

```bash
cd frontend
npm install
```

This will install all required packages including:
- React 19
- React Router DOM
- Framer Motion
- Tailwind CSS
- Lucide React icons
- Vite (build tool)

### Step 3: Start Development Server

```bash
npm run dev
```

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 4: Open in Browser

Navigate to: **http://localhost:5173/**

🎉 You should see the Maatritwa AI landing page!

---

## 📁 Project Structure Overview

```
Maatritwa-AI/
├── frontend/                 # React + Vite app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI backend + ML + Supabase SQL
│   ├── app/
│   ├── ml/
│   ├── data/
│   └── supabase/
└── docs/                     # Documentation
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build in `dist/` folder |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

Run these commands from the `frontend` folder.

### Usage Examples

```bash
# Development (most common)
npm run dev

# Build for production
npm run build

# Preview production build
npm run build
npm run preview

# Check code style
npm run lint
```

---

## 💻 VS Code Setup (Recommended)

### Extensions to Install

1. **ES7+ React/Redux/React-Native snippets** - Code snippets
2. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind
3. **Prettier - Code: formatter** - Code formatting
4. **ESLint** - Linting support
5. **Auto Rename Tag** - Auto rename paired tags

### Recommended Settings

Create `.vscode/settings.json` in the project root:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascript"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 is already in use

**Solution:**
```bash
# Use a different port
npm run dev -- --port 3000

# Or kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

### Issue: Tailwind styles not applying

**Solution:**
1. Ensure `src/index.css` has:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

2. Restart the dev server:
```bash
Ctrl + C  # Stop server
npm run dev  # Start again
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: ESLint errors on fresh clone

**Solution:**
```bash
# Run lint fix
npm run lint -- --fix
```

---

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Edit files in `src/`
- Follow existing code style
- Add comments for complex logic

### 3. Test Your Changes

```bash
# Run dev server and test in browser
npm run dev

# Check for lint errors
npm run lint
```

### 4. Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add patient search functionality"

# Push to remote
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Go to repository on GitHub
- Click "New Pull Request"
- Select your branch
- Add description of changes
- Request review from teammates

---

## 🔧 Customization Guide

### Changing Theme Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#6C5CE7',    // Change this
    light: '#A29BFE',
    dark: '#5F3DC4',
  },
  // ... other colors
}
```

### Adding a New Route

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`:

```jsx
import NewPage from "./pages/NewPage"

<Route path="/new-path" element={<NewPage />} />
```

### Adding a New Component

1. Create file in appropriate folder (`src/components/shared/` or `src/components/asha/`)
2. Use existing components as template
3. Export and import where needed

---

## 📚 Learning Resources

New to the tech stack? Check these out:

| Technology | Resource |
|------------|----------|
| React | [React Docs](https://react.dev/) |
| Tailwind CSS | [Tailwind Docs](https://tailwindcss.com/docs) |
| Framer Motion | [Framer Motion Docs](https://www.framer.com/motion/) |
| React Router | [React Router Docs](https://reactrouter.com/) |
| Vite | [Vite Docs](https://vitejs.dev/guide/) |

---

## 🤝 Need Help?

If you encounter any issues not covered here:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [GitHub Issues](../../issues)
3. Ask in the team Discord/Slack channel
4. Create a new issue with detailed description

---

## ✅ Setup Checklist

- [ ] Node.js installed (v18+)
- [ ] Repository cloned
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Landing page loads at http://localhost:5173/
- [ ] All three role cards visible
- [ ] Can navigate to ASHA Dashboard
- [ ] VS Code extensions installed (optional but recommended)

---

**Happy Coding! 💙**

*For architecture details, see [docs/architecture.md](./docs/architecture.md)*
