// Question-level CRUD for an existing questionnaire version.
// Mounted at /api/v1/admin/questionnaires by the admin router.
import { Router } from 'express';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requirePermission } from '../../middleware/auth.js';
import * as svc from '../../services/admin.service.js';

export const questionnaireApiRouter = Router({ mergeParams: true });

// PUT /:id/questions/reorder — MUST be before /:id/questions/:qid so "reorder"
// is not matched as a :qid param.
questionnaireApiRouter.put(
  '/:id/questions/reorder',
  requirePermission('questionnaires.manage'),
  asyncHandler(async (req, res) => {
    const { orderedIds } = req.body as { orderedIds?: string[] };
    if (!Array.isArray(orderedIds) || orderedIds.length === 0)
      throw new HttpError(400, 'validation_error', 'orderedIds[] required');
    res.json(await svc.reorderQuestions(req.params['id'] as string, orderedIds));
  }),
);

// POST /:id/questions — add a question to an existing questionnaire
questionnaireApiRouter.post(
  '/:id/questions',
  requirePermission('questionnaires.manage'),
  asyncHandler(async (req, res) => {
    const body = req.body as { type?: string; label?: string; required?: boolean; options?: string[] };
    if (!body.type || !body.label) throw new HttpError(400, 'validation_error', 'type and label required');
    res.status(201).json(await svc.addQuestion(req.params['id'] as string, body as { type: string; label: string; required: boolean; options?: string[] }));
  }),
);

// PUT /:id/questions/:qid — update an existing question
questionnaireApiRouter.put(
  '/:id/questions/:qid',
  requirePermission('questionnaires.manage'),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateQuestion(
        req.params['id'] as string,
        req.params['qid'] as string,
        req.body as { type?: string; label?: string; required?: boolean; options?: string[] | null },
      ),
    );
  }),
);

// DELETE /:id/questions/:qid — remove a question
questionnaireApiRouter.delete(
  '/:id/questions/:qid',
  requirePermission('questionnaires.manage'),
  asyncHandler(async (req, res) => {
    res.json(await svc.deleteQuestion(req.params['id'] as string, req.params['qid'] as string));
  }),
);
