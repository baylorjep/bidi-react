import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Slider,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const HairAndMakeupStepper = ({ onComplete, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [budgetRange, setBudgetRange] = useState([0, 0]);
  const [recommendedBudget, setRecommendedBudget] = useState(null);

  const steps = [
    'Service Details',
    'Budget & Timeline',
    'Special Requests',
  ];

  const validationSchema = Yup.object().shape({
    service_type: Yup.string().required('Service type is required'),
    number_of_people: Yup.number()
      .required('Number of people is required')
      .min(1, 'Must be at least 1 person'),
    preferred_style: Yup.string().required('Preferred style is required'),
    budget_min: Yup.number()
      .required('Minimum budget is required')
      .min(0, 'Budget cannot be negative'),
    budget_max: Yup.number()
      .required('Maximum budget is required')
      .min(Yup.ref('budget_min'), 'Maximum budget must be greater than minimum budget'),
    event_date: Yup.date().required('Event date is required'),
    special_requests: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      service_type: initialData?.service_type || '',
      number_of_people: initialData?.number_of_people || 1,
      preferred_style: initialData?.preferred_style || '',
      budget_min: initialData?.budget_min || 0,
      budget_max: initialData?.budget_max || 0,
      event_date: initialData?.event_date || '',
      special_requests: initialData?.special_requests || '',
    },
    validationSchema,
    onSubmit: (values) => {
      onComplete(values);
    },
  });

  const calculateRecommendedBudget = () => {
    const { service_type, number_of_people, preferred_style } = formik.values;
    
    // Only calculate if all required values are present
    if (!service_type || !number_of_people || !preferred_style) {
      setRecommendedBudget(null);
      return;
    }
    
    // Base rates for different service types
    const baseRates = {
      'bridal': 150,
      'bridesmaids': 80,
      'mother-of-bride': 100,
      'groom': 50,
      'groomsmen': 40,
    };

    // Style multipliers
    const styleMultipliers = {
      'natural': 1,
      'glamorous': 1.5,
      'vintage': 1.3,
      'modern': 1.2,
    };

    // Calculate base cost
    const baseCost = baseRates[service_type] || 100;
    const styleMultiplier = styleMultipliers[preferred_style] || 1;
    const totalCost = baseCost * number_of_people * styleMultiplier;

    // Add 20% buffer for additional services and contingencies
    const recommendedMin = Math.floor(totalCost * 0.8);
    const recommendedMax = Math.ceil(totalCost * 1.2);

    setRecommendedBudget({
      min: recommendedMin,
      max: recommendedMax,
      explanation: `Based on ${number_of_people} people, ${service_type} service, and ${preferred_style} style. Includes buffer for additional services.`,
    });
  };

  useEffect(() => {
    calculateRecommendedBudget();
  }, [formik.values.service_type, formik.values.number_of_people, formik.values.preferred_style]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      formik.handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  name="service_type"
                  value={formik.values.service_type}
                  onChange={formik.handleChange}
                  error={formik.touched.service_type && Boolean(formik.errors.service_type)}
                >
                  <MenuItem value="bridal">Bridal</MenuItem>
                  <MenuItem value="bridesmaids">Bridesmaids</MenuItem>
                  <MenuItem value="mother-of-bride">Mother of the Bride</MenuItem>
                  <MenuItem value="groom">Groom</MenuItem>
                  <MenuItem value="groomsmen">Groomsmen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                name="number_of_people"
                label="Number of People"
                value={formik.values.number_of_people}
                onChange={formik.handleChange}
                error={formik.touched.number_of_people && Boolean(formik.errors.number_of_people)}
                helperText={formik.touched.number_of_people && formik.errors.number_of_people}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Preferred Style</InputLabel>
                <Select
                  name="preferred_style"
                  value={formik.values.preferred_style}
                  onChange={formik.handleChange}
                  error={formik.touched.preferred_style && Boolean(formik.errors.preferred_style)}
                >
                  <MenuItem value="natural">Natural</MenuItem>
                  <MenuItem value="glamorous">Glamorous</MenuItem>
                  <MenuItem value="vintage">Vintage</MenuItem>
                  <MenuItem value="modern">Modern</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {recommendedBudget && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Recommended Budget Range:</Typography>
                  <Typography>${recommendedBudget.min} - ${recommendedBudget.max}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recommendedBudget.explanation}
                  </Typography>
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="budget_min"
                label="Minimum Budget ($)"
                value={formik.values.budget_min}
                onChange={formik.handleChange}
                error={formik.touched.budget_min && Boolean(formik.errors.budget_min)}
                helperText={formik.touched.budget_min && formik.errors.budget_min}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="budget_max"
                label="Maximum Budget ($)"
                value={formik.values.budget_max}
                onChange={formik.handleChange}
                error={formik.touched.budget_max && Boolean(formik.errors.budget_max)}
                helperText={formik.touched.budget_max && formik.errors.budget_max}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                name="event_date"
                label="Event Date"
                value={formik.values.event_date}
                onChange={formik.handleChange}
                error={formik.touched.event_date && Boolean(formik.errors.event_date)}
                helperText={formik.touched.event_date && formik.errors.event_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Special Requests
              </Typography>
              <ReactQuill
                value={formik.values.special_requests}
                onChange={(value) => formik.setFieldValue('special_requests', value)}
                style={{ height: '200px', marginBottom: '50px' }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <StyledPaper>
        {renderStepContent(activeStep)}
      </StyledPaper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!formik.isValid}
        >
          {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default HairAndMakeupStepper; 