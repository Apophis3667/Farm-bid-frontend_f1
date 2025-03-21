import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Chip,
  Collapse,
  Stack,
  useTheme
} from '@mui/material';
import {
  Gavel as GavelIcon,
  AccessTime as TimeIcon,
  MonetizationOn as MoneyIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import axios from 'axios';

const CreateAuction = ({ products }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    productId: '',
    startingBid: '',
    auctionQuantity: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  // Calculate minimum date/time (now + 1 hour)
  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  // Calculate maximum date/time (now + 7 days)
  const maxDateTime = new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 16);

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
    setSuccess(false);
  };

  const getSelectedProduct = () => {
    return products.find(product => product._id === formData.productId);
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!formData.productId || !formData.startingBid || !formData.endTime) {
        throw new Error('All fields are required');
      }

      // Validate starting bid is a positive number
      const startingBid = parseFloat(formData.startingBid);
      if (isNaN(startingBid) || startingBid <= 0) {
        throw new Error('Starting bid must be a positive number');
      }

      // Validate end time
      const endTime = new Date(formData.endTime);
      const now = new Date();
      if (endTime <= now) {
        throw new Error('End time must be in the future');
      }

      // Get the selected product
      const selectedProduct = getSelectedProduct();
      
      const response = await axios.post(
        `${API_URL}/api/auctions/create`,
        {
          productId: formData.productId,
          startingPrice: parseFloat(formData.startingBid),
          endTime: formData.endTime,
          startTime: new Date().toISOString(), // Add missing startTime
          quantity: parseFloat(formData.auctionQuantity),
          farmer: localStorage.getItem('userId'), // Add missing farmer ID
          minIncrement: 1,
          delivery: false
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      setFormData({
        productId: '',
        startingBid: '',
        endTime: '',
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error creating auction';
      setError(errorMessage);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon color="primary" />
          Create New Auction
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Set up an auction for your products with custom duration and starting bid
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Collapse in={success}>
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(false)}
        >
          Auction created successfully! Your product is now live for bidding.
        </Alert>
      </Collapse>

      <Collapse in={!!error}>
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      </Collapse>

      <form onSubmit={handleCreateAuction}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Select Product</InputLabel>
            <Select
              value={formData.productId}
              onChange={handleInputChange('productId')}
              label="Select Product"
              required
              startAdornment={
                <InputAdornment position="start">
                  <InventoryIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="">
                <em>Choose a product to auction</em>
              </MenuItem>
              {products.map(product => (
                <MenuItem key={product._id} value={product._id}>
                  {product.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.productId && (
            <Box sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                Selected Product Details:
              </Typography>
              <Typography variant="body1">
                {getSelectedProduct()?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getSelectedProduct()?.description}
              </Typography>
            </Box>
          )}

          <TextField
            label="Starting Bid"
            type="number"
            value={formData.startingBid}
            onChange={handleInputChange('startingBid')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon />
                  $
                </InputAdornment>
              ),
              inputProps: { min: 0, step: "0.01" }
            }}
          />

          <TextField
            label="Auction End Time"
            type="datetime-local"
            value={formData.endTime}
            onChange={handleInputChange('endTime')}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TimeIcon />
                </InputAdornment>
              ),
            }}
            inputProps={{
              min: minDateTime,
              max: maxDateTime
            }}
            helperText="Auction duration must be between 1 hour and 7 days"
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <GavelIcon />}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Creating Auction...' : 'Create Auction'}
            </Button>
            {formData.startingBid && (
              <Chip
                label={`Starting at $${parseFloat(formData.startingBid).toFixed(2)}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};

export default CreateAuction;