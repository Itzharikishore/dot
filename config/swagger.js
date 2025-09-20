const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DOT Therapy Backend API',
      version: '1.0.0',
      description: 'REST API for DOT Occupational Therapy Platform - Child Management, Activities, and Healthcare Services',
      contact: {
        name: 'DOT Therapy Team',
        email: 'support@dottherapy.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['superuser', 'hospital', 'therapist', 'child'], example: 'child' },
            isEmailVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Child: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            parentId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            firstName: { type: 'string', example: 'Emma' },
            lastName: { type: 'string', example: 'Smith' },
            dateOfBirth: { type: 'string', format: 'date', example: '2015-06-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer-not-to-say'], example: 'female' },
            profilePicture: { type: 'string', example: 'https://example.com/profile.jpg' },
            notes: { type: 'string', example: 'Loves playing with blocks' },
            tags: { type: 'array', items: { type: 'string' }, example: ['autism', 'speech-delay'] },
            medical: {
              type: 'object',
              properties: {
                diagnosis: { type: 'string', example: 'Autism Spectrum Disorder' },
                medications: { type: 'array', items: { type: 'string' }, example: ['Risperidone'] },
                allergies: { type: 'array', items: { type: 'string' }, example: ['Peanuts'] }
              }
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Activity: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            title: { type: 'string', example: 'Fine Motor Skills - Button Practice' },
            description: { type: 'string', example: 'Practice buttoning and unbuttoning to improve fine motor skills' },
            category: { type: 'string', example: 'fine-motor' },
            subcategory: { type: 'string', example: 'dressing-skills' },
            difficultyLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
            ageRange: {
              type: 'object',
              properties: {
                min: { type: 'number', example: 3 },
                max: { type: 'number', example: 8 }
              }
            },
            instructions: { type: 'string', example: 'Step-by-step instructions for the activity' },
            thumbnailImage: { type: 'string', example: 'https://example.com/activity.jpg' },
            estimatedDuration: { type: 'number', example: 15 },
            createdBy: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            status: { type: 'string', enum: ['active', 'inactive', 'archived'], example: 'active' },
            visibility: { type: 'string', enum: ['public', 'private'], example: 'public' },
            tags: { type: 'array', items: { type: 'string' }, example: ['fine-motor', 'dressing'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ActivityAssignment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            childId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            activityId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            assignedBy: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            dueDate: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
            notes: { type: 'string', example: 'Focus on hand-eye coordination' },
            status: { type: 'string', enum: ['assigned', 'in-progress', 'completed', 'cancelled'], example: 'assigned' },
            progress: {
              type: 'object',
              properties: {
                completionPercent: { type: 'number', minimum: 0, maximum: 100, example: 75 },
                score: { type: 'number', minimum: 0, maximum: 100, example: 85 },
                submittedAt: { type: 'string', format: 'date-time' },
                artifacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', example: 'https://example.com/artifact.jpg' },
                      mimeType: { type: 'string', example: 'image/jpeg' },
                      uploadedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                },
                therapistNotes: { type: 'string', example: 'Great progress with fine motor control' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        HomeProgram: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            childId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            therapistId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            title: { type: 'string', example: 'Weekly Fine Motor Program' },
            description: { type: 'string', example: 'Comprehensive fine motor skills development program' },
            startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2024-03-31T23:59:59Z' },
            status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'], example: 'active' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
                  activityId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
                  targetFrequencyPerWeek: { type: 'number', example: 3 },
                  dueDate: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
                  notes: { type: 'string', example: 'Practice daily for best results' },
                  status: { type: 'string', enum: ['assigned', 'in-progress', 'completed', 'skipped'], example: 'assigned' },
                  completionRecords: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        completedAt: { type: 'string', format: 'date-time' },
                        score: { type: 'number', minimum: 0, maximum: 100, example: 90 },
                        notes: { type: 'string', example: 'Excellent execution' }
                      }
                    }
                  }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PatientDetail: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            userId: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            name: { type: 'string', example: 'Emma Smith' },
            dateOfBirth: { type: 'string', format: 'date', example: '2015-06-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer-not-to-say'], example: 'female' },
            medicalHistory: { type: 'string', example: 'Born at 36 weeks, early intervention since age 2' },
            allergies: { type: 'array', items: { type: 'string' }, example: ['Peanuts', 'Dairy'] },
            pastDiseases: { type: 'array', items: { type: 'string' }, example: ['RSV at 6 months'] },
            documents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Immunization Record' },
                  url: { type: 'string', example: 'https://example.com/doc.pdf' },
                  mimeType: { type: 'string', example: 'application/pdf' },
                  uploadedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            lastUpdatedBy: { type: 'string', example: '60f7b3b3b3b3b3b3b3b3b3b3' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error information' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/api/*.js', './controllers/*.js', './controllers/v1/*.js']
};

const specs = swaggerJSDoc(options);

module.exports = specs;
