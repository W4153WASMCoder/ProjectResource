import pool from "../db.js";
import type { RowDataPacket } from "mysql2";

export class Project {
    private _isDirty: boolean = false; // Track if the record needs saving

    ProjectID: number | null;
    private _owningUserID: number;
    private _projectName: string;
    private _creationDate: Date;

    constructor(
        ProjectID: number | null,
        OwningUserID: number,
        ProjectName: string,
        CreationDate: Date,
    ) {
        this.ProjectID = ProjectID;
        this._owningUserID = OwningUserID;
        this._projectName = ProjectName;
        this._creationDate = CreationDate;
    }
    toJSON(): string {
        return JSON.stringify({
            ProjectID: this.ProjectID,
            OwningUserID: this.OwningUserID,
            ProjectName: this._projectName,
            CreationDate: this._creationDate,
        });
    }

    static async find(ProjectID: number): Promise<Project | null> {
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM Projects WHERE project_id = ?",
                [ProjectID],
            );

            if (rows.length === 0) return null;

            const { OwningUserID, ProjectName, CreationDate } = rows[0] as {
                OwningUserID: number;
                ProjectName: string;
                CreationDate: Date;
            };
            return new Project(
                ProjectID,
                OwningUserID,
                ProjectName,
                new Date(CreationDate),
            );
        } catch (error) {
            console.error(
                `Error fetching Project with ID ${ProjectID}:`,
                error,
            );
            return null;
        }
    }

    // Find all projects with pagination
    static async findAll(options: {
        limit: number;
        offset: number;
        filters?: { ProjectName?: string; OwningUserID?: number };
        sort?: string;
        order?: "asc" | "desc";
    }): Promise<{ projects: Project[]; total: number }> {
        const {
            limit,
            offset,
            filters = {},
            sort = "ProjectID",
            order = "asc",
        } = options;

        let filterClauses = "";
        const filterValues: any[] = [];

        if (filters.ProjectName) {
            filterClauses += " AND ProjectName LIKE ?";
            filterValues.push(`%${filters.ProjectName}%`);
        }

        if (filters.OwningUserID !== undefined) {
            filterClauses += " AND OwningUserID = ?";
            filterValues.push(filters.OwningUserID);
        }

        const totalQuery = `SELECT COUNT(*) as total FROM Projects WHERE 1=1${filterClauses}`;
        const dataQuery = `SELECT * FROM Projects WHERE 1=1${filterClauses} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

        try {
            // Get total count
            const [countRows] = await pool.query<RowDataPacket[]>(
                totalQuery,
                filterValues,
            );
            const total = countRows[0].total;

            // Get projects with limit and offset
            const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [
                ...filterValues,
                limit,
                offset,
            ]);

            const projects = rows.map((row) => {
                const { ProjectID, OwningUserID, ProjectName, CreationDate } =
                    row;
                return new Project(
                    ProjectID,
                    OwningUserID,
                    ProjectName,
                    new Date(CreationDate),
                );
            });

            return { projects, total };
        } catch (error) {
            console.error("Error fetching projects:", error);
            throw error;
        }
    }
    // Save method to insert or update a project if it's dirty
    async save(): Promise<Project> {
        if (!this._isDirty) return this;

        if (this.ProjectID) {
            // Update existing project
            await pool.query(
                "UPDATE Project SET OwningUserID = ?, ProjectName = ?, CreationDate = ? WHERE ProjectID = ?",
                [
                    this._owningUserID,
                    this._projectName,
                    this._creationDate,
                    this.ProjectID,
                ],
            );
        } else {
            // Insert new project and get the ID
            const [result]: any = await pool.query(
                "INSERT INTO Project (OwningUserID, ProjectName, CreationDate) VALUES (?, ?, ?)",
                [this._owningUserID, this._projectName, this._creationDate],
            );
            this.ProjectID = result.insertId;
        }

        this._isDirty = false;
        return this;
    }
    static async deleteById(id: number): Promise<boolean> {
        try {
            // Check if file exists
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM Project WHERE project_id = ?",
                [id],
            );

            if (rows.length === 0) {
                // Return false if the user does not exist
                return false;
            }

            // Proceed to delete the user
            await pool.query("DELETE FROM Project WHERE project_id = ?", [id]);
            return true;
        } catch (error) {
            // Log the error for debugging
            console.error("Error deleting file by ID:", error);

            // Return false in case of an error
            return false;
        }
    }
    get OwningUserID() {
        return this._owningUserID;
    }
    set OwningUserID(value: number) {
        if (value === this._owningUserID) return;

        this._owningUserID = value;
        this._isDirty = true;
    }

    get ProjectName() {
        return this._projectName;
    }
    set ProjectName(value: string) {
        if (value === this._projectName) return;

        this._projectName = value;
        this._isDirty = true;
    }

    get CreationDate() {
        return this._creationDate;
    }
    set CreationDate(value: Date) {
        if (value === this._creationDate) return;

        this._creationDate = value;
        this._isDirty = true;
    }
}


export class ProjectFile {
    private _isDirty: boolean = false;

    FileID: number | null;
    private _projectID: number;
    private _parentDirectory: number | null;
    private _fileName: string;
    private _isDirectory: boolean;
    private _creationDate: Date;

    constructor(
        FileID: number | null,
        ProjectID: number,
        ParentDirectory: number | null,
        FileName: string,
        IsDirectory: boolean,
        CreationDate: Date,
    ) {
        this.FileID = FileID;
        this._projectID = ProjectID;
        this._parentDirectory = ParentDirectory;
        this._fileName = FileName;
        this._isDirectory = IsDirectory;
        this._creationDate = CreationDate;
    }
    toJSON(): string {
        return JSON.stringify({
            FileID: this.FileID,
            ProjectID: this._projectID,
            ParentDirectory: this._parentDirectory,
            FileName: this._fileName,
            IsDirectory: this._isDirectory,
            CreationDate: this._creationDate,
        });
    }

    static async find(FileID: number): Promise<ProjectFile | null> {
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM ProjectFiles WHERE FileID = ?",
                [FileID],
            );

            if (rows.length === 0) return null;

            const {
                ProjectID,
                ParentDirectory,
                FileName,
                IsDirectory,
                CreationDate,
            } = rows[0] as {
                ProjectID: number;
                ParentDirectory: number | null;
                FileName: string;
                IsDirectory: boolean;
                CreationDate: Date;
            };
            return new ProjectFile(
                FileID,
                ProjectID,
                ParentDirectory,
                FileName,
                !!IsDirectory,
                new Date(CreationDate),
            );
        } catch (error) {
            console.error(
                `Error fetching ProjectFile with ID ${FileID}:`,
                error,
            );
            return null;
        }
    }
    // Find all project files with pagination
    static async findAll(options: {
        limit: number;
        offset: number;
        filters?: { ProjectID?: number; FileName?: string; IsDirectory?: boolean };
        sort?: string;
        order?: 'asc' | 'desc';
    }): Promise<{ files: ProjectFile[]; total: number }> {
        const { limit, offset, filters = {}, sort = 'FileID', order = 'asc' } = options;

        let filterClauses = '';
        const filterValues: any[] = [];

        // Build filter clauses
        if (filters.ProjectID !== undefined) {
            filterClauses += ' AND ProjectID = ?';
            filterValues.push(filters.ProjectID);
        }

        if (filters.FileName) {
            filterClauses += ' AND FileName LIKE ?';
            filterValues.push(`%${filters.FileName}%`);
        }

        if (filters.IsDirectory !== undefined) {
            filterClauses += ' AND IsDirectory = ?';
            filterValues.push(filters.IsDirectory ? 1 : 0);
        }

        // Validate 'sort' and 'order' parameters to prevent SQL injection
        const validSortFields = ['FileID', 'FileName', 'CreationDate'];
        if (!validSortFields.includes(sort)) {
            throw new Error(`Invalid sort field: ${sort}`);
        }

        const validOrderValues = ['asc', 'desc'];
        if (!validOrderValues.includes(order)) {
            throw new Error(`Invalid order value: ${order}`);
        }

        const totalQuery = `SELECT COUNT(*) as total FROM ProjectFiles WHERE 1=1${filterClauses}`;
        const dataQuery = `SELECT * FROM ProjectFiles WHERE 1=1${filterClauses} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

        try {
            // Get total count
            const [countRows] = await pool.query<RowDataPacket[]>(totalQuery, filterValues);
            const total = countRows[0].total;

            // Get files with limit, offset, filters, and sorting
            const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...filterValues, limit, offset]);

            const files = rows.map((row) => {
                const {
                    FileID,
                    ProjectID,
                    ParentDirectory,
                    FileName,
                    IsDirectory,
                    CreationDate,
                } = row;
                return new ProjectFile(
                    FileID,
                    ProjectID,
                    ParentDirectory,
                    FileName,
                    !!IsDirectory,
                    new Date(CreationDate),
                );
            });

            return { files, total };
        } catch (error) {
            console.error("Error fetching project files:", error);
            throw error;
        }
    }
    async save(): Promise<ProjectFile> {
        if (!this._isDirty) return this;

        if (this.FileID) {
            // Update existing file
            await pool.query(
                "UPDATE ProjectFiles SET ProjectID = ?, ParentDirectory = ?, FileName = ?, IsDirectory = ?, CreationDate = ? WHERE FileID = ?",
                [
                    this._projectID,
                    this._parentDirectory,
                    this._fileName,
                    this._isDirectory,
                    this._creationDate,
                    this.FileID,
                ],
            );
        } else {
            // Insert new file and get the ID
            const [result]: any = await pool.query(
                "INSERT INTO ProjectFiles (ProjectID, ParentDirectory, FileName, IsDirectory, CreationDate) VALUES (?, ?, ?, ?, ?)",
                [
                    this._projectID,
                    this._parentDirectory,
                    this._fileName,
                    this._isDirectory,
                    this._creationDate,
                ],
            );
            this.FileID = result.insertId;
        }

        this._isDirty = false;
        return this;
    }
    static async deleteById(id: number): Promise<boolean> {
        try {
            // Check if file exists
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM ProjectFiles WHERE file_id = ?",
                [id],
            );

            if (rows.length === 0) {
                // Return false if the user does not exist
                return false;
            }

            // Proceed to delete the user
            await pool.query("DELETE FROM ProjectFiles WHERE file_id = ?", [
                id,
            ]);
            return true;
        } catch (error) {
            // Log the error for debugging
            console.error("Error deleting file by ID:", error);

            // Return false in case of an error
            return false;
        }
    }
    get ProjectID() {
        return this._projectID;
    }
    set ProjectID(value: number) {
        if (value === this._projectID) return;

        this._projectID = value;
        this._isDirty = true;
    }

    get ParentDirectory() {
        return this._parentDirectory;
    }
    set ParentDirectory(value: number | null) {
        if (value === this._parentDirectory) return;

        this._parentDirectory = value;
        this._isDirty = true;
    }

    get FileName() {
        return this._fileName;
    }
    set FileName(value: string) {
        if (value === this._fileName) return;

        this._fileName = value;
        this._isDirty = true;
    }

    get IsDirectory() {
        return this._isDirectory;
    }
    set IsDirectory(value: boolean) {
        if (value === this._isDirectory) return;

        this._isDirectory = value;
        this._isDirty = true;
    }

    get CreationDate() {
        return this._creationDate;
    }
    set CreationDate(value: Date) {
        if (value === this._creationDate) return;

        this._creationDate = value;
        this._isDirty = true;
    }
}
