// // server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const clientRoutes = require('./Routes/clientRoutes');
// const contactRoutes = require('./Routes/contactRoutes');

// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(express.static('Public'));

// // Routes
// app.use('/api/clients', clientRoutes);
// app.use('/api/contacts', contactRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const path = require('path'); // Required to resolve paths to static files

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'Public'))); // Serving static files from the 'Public' directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html')); // Ensure 'index.html' exists inside 'Public/html' folder
});
app.use(express.json()); // to parse JSON requests


// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost', // MySQL server host
    user: 'root', // MySQL username
    password: 'Nolubabalomaxazana03.', // MySQL password
    database: 'client_management' // Database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Routes
app.post('/add-client', (req, res) => {
    const { clientName } = req.body;

    if (!clientName) {
        return res.status(400).json({ success: false, message: 'Client name is required' });
    }

    const query = 'INSERT INTO clients (client_name) VALUES (?)';
    db.query(query, [clientName], (err, result) => {
        if (err) {
            console.error('Error adding client:', err);
            return res.status(500).json({ success: false, message: 'Error adding client' });
        }

        res.json({ success: true });
    });
});

app.get('/get-clients', (req, res) => {
    const query = 'SELECT * FROM clients';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching clients:', err);
            return res.status(500).json({ success: false, message: 'Error fetching clients' });
        }

        res.json({ clients: results });
    });
});

app.post('/add-contact', (req, res) => {
    const { contactName, contactEmail, clientId } = req.body;

    if (!contactName || !contactEmail || !clientId) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const query = 'INSERT INTO contacts (client_name, contact_email, client_id) VALUES (?, ?, ?)';
    db.query(query, [contactName, contactEmail, clientId], (err, result) => {
        if (err) {
            console.error('Error adding contact:', err);
            return res.status(500).json({ success: false, message: 'Error adding contact' });
        }

        // Update the linked_contacts count for the client
        const updateClientQuery = 'UPDATE clients SET linked_contacts = linked_contacts + 1 WHERE id = ?';
        db.query(updateClientQuery, [clientId], (updateErr) => {
            if (updateErr) {
                console.error('Error updating client:', updateErr);
                return res.status(500).json({ success: false, message: 'Error updating client' });
            }

            res.json({ success: true });
        });
    });
});

app.get('/get-contacts', (req, res) => {
    const query = 'SELECT * FROM contacts';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching contacts:', err);
            return res.status(500).json({ success: false, message: 'Error fetching contacts' });
        }

        res.json({ contacts: results });
    });
});

app.delete('/unlink-contact/:id', (req, res) => {
    const contactId = req.params.id;

    // First, get the client ID for the contact to decrease linked_contacts
    const getClientQuery = 'SELECT client_id FROM contacts WHERE id = ?';
    db.query(getClientQuery, [contactId], (err, results) => {
        if (err) {
            console.error('Error getting contact client ID:', err);
            return res.status(500).json({ success: false, message: 'Error unlinking contact' });
        }

        const clientId = results[0]?.client_id;

        if (!clientId) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        // Delete the contact
        const deleteContactQuery = 'DELETE FROM contacts WHERE id = ?';
        db.query(deleteContactQuery, [contactId], (deleteErr) => {
            if (deleteErr) {
                console.error('Error deleting contact:', deleteErr);
                return res.status(500).json({ success: false, message: 'Error deleting contact' });
            }

            // Update the linked_contacts count for the client
            const updateClientQuery = 'UPDATE clients SET linked_contacts = linked_contacts - 1 WHERE id = ?';
            db.query(updateClientQuery, [clientId], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating client:', updateErr);
                    return res.status(500).json({ success: false, message: 'Error updating client' });
                }

                res.json({ success: true });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

