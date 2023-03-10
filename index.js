// ***************************************************************************
// Bank API code from Web Dev For Beginners project
// https://github.com/microsoft/Web-Dev-For-Beginners/tree/main/7-bank-project/api
// ***************************************************************************

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const crypto = require('crypto');
const pkg = require('./package.json');
const winston = require('winston');

// App constants
const port = process.env.PORT || 3000;
const apiPrefix = '/api';

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

// Store data in-memory, not suited for production use!
const db = {
    test: {
      user: 'test',
      currency: '$',
      description: `Test account`,
      balance: 75,
      transactions: [
        { id: '1', date: '2020-10-01', object: 'Pocket money', amount: 50 },
        { id: '2', date: '2020-10-03', object: 'Book', amount: -10 },
        { id: '3', date: '2020-10-04', object: 'Sandwich', amount: -5 }
      ],
    },
    jondoe: {
        user: 'jondoe',
        currency: '$',
        description: `Second test account`,
        balance: 150,
        transactions: [
          { id: '1', date: '2022-10-01', object: 'Gum', amount: -2 },
          { id: '2', date: '2022-10-03', object: 'Book', amount: -10 },
          { id: '3', date: '2022-10-04', object: 'Restaurant', amount: -45 }
        ],
      }
  
  };
  
// Create the Express app & setup middlewares
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: /http:\/\/(127(\.\d){3}|localhost)/}));
app.options('*', cors());

// ***************************************************************************

// Configure routes
const router = express.Router();

// Hello World for index page
app.get('/', function (req, res) {
  return res.send("Hello World!!");
})

app.get('/mymessage', function (req, res) {

  console.log('HTML: <h1>Hello H1</h1>');
  console.log('JavaScript: <script>alert("hello");</script>');
  console.log('IFRAME: <iframe src="https://www.microsoft.com" title="Testing 123"></iframe>');
  console.log('VIDEO: <object data="https://www.youtube.com/embed/dQw4w9WgXcQ" height="300px" width="450" allowfullscreen></object>');
  console.log('<img src="https://i.imgur.com/xlL74PA.jpeg" alt="testing123" width="400" height="400">');
  console.log('IMAGE: <blockquote class="imgur-embed-pub" lang="en" data-id="a/8rx9MaG" data-context="false" ><a href="//imgur.com/a/8rx9MaG"></a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>');

  

  return res.send("Check your logs!!");
})


app.get('/api', function (req, res) {
    return res.send("Fabrikam Bank API");
})
  
// ----------------------------------------------
  // Create an account
router.post('/accounts', (req, res) => {
    // Check mandatory request parameters
    if (!req.body.user || !req.body.currency) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    // Check if account already exists
    if (db[req.body.user]) {
      return res.status(409).json({ error: 'User already exists' });
    }
  
    // Convert balance to number if needed
    let balance = req.body.balance;
    if (balance && typeof balance !== 'number') {
      balance = parseFloat(balance);
      if (isNaN(balance)) {
        return res.status(400).json({ error: 'Balance must be a number' });  
      }
    }
  
    // Create account
    const account = {
      user: req.body.user,
      currency: req.body.currency,
      description: req.body.description || `${req.body.user}'s budget`,
      balance: balance || 0,
      transactions: [],
    };
    db[req.body.user] = account;
  
    return res.status(201).json(account);
  });
  
// ----------------------------------------------

// Get all data for the specified account
router.get('/accounts/:user', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    return res.json(account);
  });
  
  // ----------------------------------------------
  
// Remove specified account
router.delete('/accounts/:user', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    // Removed account
    delete db[req.params.user];
  
    res.sendStatus(204);
  });
  
  // ----------------------------------------------
  
  // Add a transaction to a specific account
  router.post('/accounts/:user/transactions', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    // Check mandatory requests parameters
    if (!req.body.date || !req.body.object || !req.body.amount) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    // Convert amount to number if needed
    let amount = req.body.amount;
    if (amount && typeof amount !== 'number') {
      amount = parseFloat(amount);
    }
  
    // Check that amount is a valid number
    if (amount && isNaN(amount)) {
      return res.status(400).json({ error: 'Amount must be a number' });
    }
  
    // Generates an ID for the transaction
    const id = crypto
      .createHash('md5')
      .update(req.body.date + req.body.object + req.body.amount)
      .digest('hex');
  
    // Check that transaction does not already exist
    if (account.transactions.some((transaction) => transaction.id === id)) {
      return res.status(409).json({ error: 'Transaction already exists' });
    }
  
    // Add transaction
    const transaction = {
      id,
      date: req.body.date,
      object: req.body.object,
      amount,
    };
    account.transactions.push(transaction);
  
    // Update balance
    account.balance += transaction.amount;
  
    return res.status(201).json(transaction);
  });
  
  // ----------------------------------------------
  
  // Remove specified transaction from account
  router.delete('/accounts/:user/transactions/:id', (req, res) => {
    const account = db[req.params.user];
  
    // Check if account exists
    if (!account) {
      return res.status(404).json({ error: 'User does not exist' });
    }
  
    const transactionIndex = account.transactions.findIndex(
      (transaction) => transaction.id === req.params.id
    );
  
    // Check if transaction exists
    if (transactionIndex === -1) {
      return res.status(404).json({ error: 'Transaction does not exist' });
    }
  
    // Remove transaction
    account.transactions.splice(transactionIndex, 1);
  
    res.sendStatus(204);
  });
  
// ***************************************************************************

// Add 'api` prefix to all routes
app.use(apiPrefix, router);

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.error('HELLO WORLD');
    logger.log('error', "127.0.0.1 - there's no place like home");
    logger.info("127.0.0.1 - there's no place like home");
    logger.warn("127.0.0.1 - there's no place like home");
    logger.error("127.0.0.1 - there's no place like home");
    console.error('HELLO WORLD');
  });
  
