# QuantTrade

> AI-powered financial projection platform combining mathematical models and large language models for intelligent trading analysis

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Google GenAI](https://img.shields.io/badge/Google-GenAI-4285F4.svg)](https://ai.google.dev/)

## Overview

QuantTrade is a modern web and mobile application that leverages artificial intelligence and advanced mathematical models to provide financial projections and trading insights. Built with React and powered by Google's Gemini AI, it combines quantitative analysis with natural language processing to help users make informed financial decisions.

## Features

- 🤖 **AI-Powered Analysis** - Integration with Google Gemini for intelligent financial insights
- 📊 **Advanced Visualizations** - Interactive charts and graphs using Recharts
- 🧮 **Mathematical Modeling** - Complex financial calculations using Math.js
- 💾 **Local Data Persistence** - SQLite database for storing historical data
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- ⚡ **Real-time Updates** - Live data processing and projection updates
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and Motion
- 📈 **Financial Projections** - Multiple projection models and scenarios

## Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization

### Backend
- **Express.js** - Web server
- **Better-SQLite3** - Embedded database
- **Google GenAI** - AI/ML capabilities
- **Math.js** - Advanced mathematics

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- A **Google AI API key** (for Gemini integration)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BhargavA09/QuantTrade.git
   cd QuantTrade
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Add your Google AI API key:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   NODE_ENV=development
   ```

## Usage

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Running in Production

```bash
npm run start
```

## Project Structure

```
QuantTrade/
├── src/                    # Source files
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── styles/            # CSS and styling
├── public/                # Static assets
├── server.ts              # Express server
├── index.html             # Entry HTML
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## Key Components

### AI Integration
The application uses Google's Gemini AI model for:
- Financial data analysis
- Market trend predictions
- Natural language queries about financial data
- Automated report generation

### Mathematical Models
Advanced calculations powered by Math.js:
- Statistical analysis
- Risk assessment
- Portfolio optimization
- Projection modeling

### Data Visualization
Interactive charts and graphs showing:
- Historical performance
- Projection scenarios
- Risk metrics
- Comparative analysis

## Configuration

### Database Setup
The application uses SQLite for local data storage. The database is automatically created on first run. No additional setup required.

### API Keys
You'll need to obtain a Google AI API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new project or select an existing one
3. Generate an API key
4. Add it to your `.env` file

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run start` | Run production server |
| `npm run lint` | Type-check the code |
| `npm run clean` | Remove build artifacts |

## Development

### Adding New Features

1. Create your feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Code Style

This project uses TypeScript with strict type checking. Ensure your code:
- Passes TypeScript compilation (`npm run lint`)
- Follows the existing code structure
- Includes proper type definitions
- Is properly formatted

## Security Considerations

⚠️ **Important Security Notes:**
- Never commit your `.env` file or API keys to version control
- The `.env.example` file is provided as a template only
- All API calls to Google Gemini should be handled securely
- Validate and sanitize all user inputs

## Troubleshooting

### Common Issues

**Issue: Server won't start**
- Check if port 3000 is already in use
- Verify Node.js version (should be v18+)

**Issue: API calls failing**
- Verify your Google AI API key is correct
- Check your internet connection
- Ensure the API key has proper permissions

**Issue: Build errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run clean`

## Performance

The application is optimized for performance:
- Code splitting for faster initial load
- Lazy loading of components
- Efficient state management
- Optimized build output with Vite

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Google GenAI](https://ai.google.dev/) for AI capabilities
- [React Team](https://reactjs.org/) for the amazing framework
- [Vite Team](https://vitejs.dev/) for the blazing fast build tool
- All open-source contributors

## Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/BhargavA09/QuantTrade/issues)
- Check existing issues for solutions
- Review the documentation

## Roadmap

- [ ] Real-time market data integration
- [ ] Advanced portfolio management
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Backtesting capabilities
- [ ] Social trading features
- [ ] Advanced risk analytics

---

**Built with ❤️ by [BhargavA09](https://github.com/BhargavA09)**

*Last updated: April 2026*
