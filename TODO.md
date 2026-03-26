# Maatritwa AI - Feature Implementation TODO
Current: d:/Maatritwa-AI | Status: [1/25] In Progress

## Phase 1: DB Views [x]
- [x] Add doctor_basic view (004_create_views.sql)
- [x] Add doctor_detailed view
- [x] Add mother_basic view  
- [x] Add anemia_3visit_avg view

## Phase 2: Backend Auth Removal [x]
- [x] Disable auth.py functions
- [x] Update all routers: remove Depends(require_role)

## Phase 3: ASHA Updates [x]
- [x] Backend routers/asha.py updated
- [x] Frontend PatientForm.jsx + new inputs
- [x] VitalsForm.jsx + pulse input
- [ ] AshaDashboard.jsx integrate multi-step

## Phase 4: Doctor Endpoints [ ]

## Phase 4: Doctor Endpoints [ ]

## Phase 4: Doctor Endpoints [ ]

## Phase 4: Doctor Endpoints [ ]
- [ ] routers/doctor.py: GET /patients/{id}/basic
- [ ] GET /patients/{id}/detailed
- [ ] GET /patients/{id}/anemia
- [ ] Frontend DoctorDashboard.jsx tabs

## Phase 5: Mother + ML [ ]
- [ ] routers/mother.py updates
- [ ] ml.py: 3-visit guard + anemia_trend
- [ ] Frontend MotherDashboard basic cards

## Phase 6: Frontend Cleanup [ ]
- [ ] Remove AuthContext/Login pages
- [ ] supabaseClient no auth
- [ ] Clinical labs forms/endpoints

## Phase 7: Test & Complete [ ]
- [ ] Backend tests (curl/Postman)
- [ ] Frontend npm run dev
- [ ] Full E2E: ASHA input → Doctor view → Anemia

*Updated on: $(date)
