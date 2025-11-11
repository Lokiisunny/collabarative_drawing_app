# GitHub Upload Instructions

## Quick Setup

### Step 1: Configure Git (if not already done)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `collaborative-canvas` (or your preferred name)
3. Choose Public or Private
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### Step 3: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
cd C:\Users\lokes\Downloads\sweet-shop\collaborative-canvas

git remote add origin https://github.com/YOUR_USERNAME/collaborative-canvas.git

git branch -M main

git push -u origin main
```

**Note**: If you use SSH instead of HTTPS:
```bash
git remote add origin git@github.com:YOUR_USERNAME/collaborative-canvas.git
```

### Step 4: Authentication

If prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your GitHub password)

#### How to create Personal Access Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "collaborative-canvas-upload")
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)
7. Use this token as your password when pushing

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:
```bash
gh repo create collaborative-canvas --public --source=. --remote=origin --push
```

## Troubleshooting

- **Authentication failed**: Make sure you're using a Personal Access Token, not your password
- **Repository already exists**: Change the repository name or delete the existing one
- **Permission denied**: Check your token has `repo` scope

