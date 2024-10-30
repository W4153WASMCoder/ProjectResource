// routes/projectfile.ts
import { Router, Request, Response } from "express";
import { ProjectFile } from "../models/files_models.js";
import { paginate } from "../middleware/pagination.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectFile:
 *       type: object
 *       required:
 *         - ProjectID
 *         - FileName
 *         - IsDirectory
 *       properties:
 *         FileID:
 *           type: integer
 *           description: Auto-generated ID of the file
 *         ProjectID:
 *           type: integer
 *           description: The ID of the project the file belongs to
 *         ParentDirectory:
 *           type: integer
 *           nullable: true
 *           description: The ID of the parent directory, if any
 *         FileName:
 *           type: string
 *           description: The name of the file
 *         IsDirectory:
 *           type: boolean
 *           description: True if the file is a directory, false otherwise
 *         CreationDate:
 *           type: string
 *           format: date-time
 *           description: File creation date
 *       example:
 *         FileID: 1
 *         ProjectID: 1
 *         ParentDirectory: null
 *         FileName: "example.txt"
 *         IsDirectory: false
 *         CreationDate: "2024-10-28T12:00:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: ProjectFiles
 *     description: API endpoints for project files
 */

/**
 * @swagger
 * /projectfiles:
 *   get:
 *     summary: Get a list of project files with pagination, filtering, and sorting
 *     tags:
 *       - ProjectFiles
 *     parameters:
 *       - in: query
 *         name: ProjectID
 *         schema:
 *           type: integer
 *         description: Filter files by project ID
 *       - in: query
 *         name: FileName
 *         schema:
 *           type: string
 *         description: Filter files by name
 *       - in: query
 *         name: IsDirectory
 *         schema:
 *           type: boolean
 *         description: Filter by directory status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [FileID, FileName, CreationDate]
 *           default: FileID
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of project files to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of project files to skip
 *     responses:
 *       '200':
 *         description: A paginated list of project files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectFile'
 *                 links:
 *                   type: object
 *                   properties:
 *                     self:
 *                       type: string
 *                     next:
 *                       type: string
 *                       nullable: true
 *                     prev:
 *                       type: string
 *                       nullable: true
 *                     first:
 *                       type: string
 *                     last:
 *                       type: string
 *       '400':
 *         description: Invalid query parameter
 *       '500':
 *         description: Internal server error
 */

router.get('/', paginate, async (req: Request, res: Response): Promise<void> => {
  const { limit, offset } = (req as any).pagination;
  const { ProjectID, FileName, IsDirectory, sort = 'FileID', order = 'asc' } = req.query;

  // Validate 'order' parameter
  if (order !== 'asc' && order !== 'desc') {
    res.status(400).json({ error: 'Invalid order parameter. Must be "asc" or "desc".' });
    return;
  }

  // Validate 'sort' parameter
  const validSortFields = ['FileID', 'FileName', 'CreationDate'];
  if (!validSortFields.includes(sort as string)) {
    res.status(400).json({ error: `Invalid sort parameter. Must be one of ${validSortFields.join(', ')}.` });
    return;
  }

  try {
    // Fetch project files with filtering, sorting, and pagination
    const { files, total } = await ProjectFile.findAll({
      limit,
      offset,
      filters: {
        ProjectID: ProjectID ? parseInt(ProjectID as string, 10) : undefined,
        FileName: FileName as string,
        IsDirectory: IsDirectory !== undefined ? IsDirectory === 'true' : undefined,
      },
      sort: sort as string,
      order: order as 'asc' | 'desc',
    });

    // Generate HATEOAS links (adjusted to include query parameters)
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const queryParams = new URLSearchParams({
      ...(req.query as any),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const links: any = {
      self: `${baseUrl}?${queryParams.toString()}`,
      first: `${baseUrl}?${queryParams.toString().replace(`offset=${offset}`, 'offset=0')}`,
      last: `${baseUrl}?${queryParams.toString().replace(
        `offset=${offset}`,
        `offset=${Math.floor((total - 1) / limit) * limit}`
      )}`,
    };

    if (offset + limit < total) {
      links.next = `${baseUrl}?${queryParams.toString().replace(
        `offset=${offset}`,
        `offset=${offset + limit}`
      )}`;
    }

    if (offset - limit >= 0) {
      links.prev = `${baseUrl}?${queryParams.toString().replace(
        `offset=${offset}`,
        `offset=${offset - limit}`
      )}`;
    }

    res.json({
      total,
      limit,
      offset,
      data: files,
      links,
    });
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /projectfiles/{id}:
 *   get:
 *     summary: Get a project file by ID
 *     tags:
 *       - ProjectFiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project file ID
 *     responses:
 *       '200':
 *         description: A project file object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectFile'
 *       '404':
 *         description: Project file not found
 *   put:
 *     summary: Update a project file by ID
 *     tags:
 *       - ProjectFiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project file ID
 *     requestBody:
 *       description: Project file object to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ParentDirectory:
 *                 type: integer
 *                 nullable: true
 *               FileName:
 *                 type: string
 *               IsDirectory:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Project file updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectFile'
 *       '400':
 *         description: Invalid input
 *       '404':
 *         description: Project file not found
 *   delete:
 *     summary: Delete a project file by ID
 *     tags:
 *       - ProjectFiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The project file ID
 *     responses:
 *       '204':
 *         description: Project file deleted successfully
 *       '404':
 *         description: Project file not found
 *       '500':
 *         description: Internal server error
 */

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const fileId = parseInt(req.params.id, 10);
  if (isNaN(fileId)) {
    res.status(400).send("Invalid project file ID");
    return;
  }

  try {
    const file = await ProjectFile.find(fileId);
    if (!file) {
      res.status(404).send("Project file not found");
      return;
    }
    res.json(file);
  } catch (error) {
    console.error(`Error fetching project file with ID ${fileId}:`, error);
    res.status(500).send("Internal server error");
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { ProjectID, ParentDirectory, FileName, IsDirectory } = req.body;
  if (ProjectID == null || FileName == null || IsDirectory == null) {
    res.status(400).send("Missing required fields");
    return;
  }

  const newFile = new ProjectFile(
    null, // FileID will be auto-generated
    ProjectID,
    ParentDirectory || null,
    FileName,
    IsDirectory,
    new Date(),
  );

  try {
    await newFile.save();
    const location = `${req.protocol}://${req.get("host")}${req.baseUrl}/${newFile.FileID}`;
    res.status(201).header("Location", location).json(newFile);
  } catch (error) {
    console.error("Error creating project file:", error);
    res.status(500).send("Internal server error");
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const fileId = parseInt(req.params.id, 10);
  if (isNaN(fileId)) {
    res.status(400).send("Invalid project file ID");
    return;
  }

  try {
    const file = await ProjectFile.find(fileId);
    if (!file) {
      res.status(404).send("Project file not found");
      return;
    }

    const { ParentDirectory, FileName, IsDirectory } = req.body;

    if (ParentDirectory !== undefined) file.ParentDirectory = ParentDirectory;
    if (FileName != null) file.FileName = FileName;
    if (IsDirectory != null) file.IsDirectory = IsDirectory;

    await file.save();
    res.json(file);
  } catch (error) {
    console.error(`Error updating project file with ID ${fileId}:`, error);
    res.status(500).send("Internal server error");
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const fileId = parseInt(req.params.id, 10);
  if (isNaN(fileId)) {
    res.status(400).send("Invalid project file ID");
    return;
  }

  try {
    const result = await ProjectFile.deleteById(fileId);
    if (!result) {
      res.status(404).send("Project file not found");
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting project file with ID ${fileId}:`, error);
    res.status(500).send("Internal server error");
  }
});

// router.get("/getFile/:fileName", async (req: Request, res: Response): Promise<void> => {
//   const fileName = req.params.fileName;
//   if (fileName == null) {
//     res.status(400).send("Invalid project file name");
//     return;
//   }

//   try {
//     const result = await 
//   } catch (error) {
//     console.error(`Error deleting project file with name ${fileName}:`, error);
//     res.status(500).send("Internal server error");
//   }
// });

export default router;
