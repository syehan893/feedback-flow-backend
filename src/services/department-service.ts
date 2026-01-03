import { Department } from '../models/department';
import { DepartmentRepository } from '../repositories/department-repository';

const departmentRepository = new DepartmentRepository();

/**
 * Service layer for managing department operations.
 *
 * This service provides business logic for department management, including
 * hierarchical organization of departments. Departments are organized in a tree
 * structure where each department can have a parent department and multiple child
 * departments, creating an organizational hierarchy.
 *
 * @example
 * ```typescript
 * const service = new DepartmentService();
 *
 * // Create a new department
 * const newDept = new Department('dept-1', 'Engineering', 'ENG', 1);
 * await service.createDepartment(newDept);
 *
 * // Get all departments as a hierarchical tree
 * const deptTree = await service.getAllDepartments();
 * ```
 */
export class DepartmentService {
  /**
   * Creates a new department in the system.
   *
   * @param department - The department object to create
   * @returns Promise resolving to HTTP status code (201 for success) or null if creation fails
   *
   * @example
   * ```typescript
   * const dept = new Department('dept-1', 'Engineering', 'ENG', 1);
   * const status = await departmentService.createDepartment(dept);
   * if (status === 201) {
   *   console.log('Department created successfully');
   * }
   * ```
   */
  async createDepartment(department: Department): Promise<number | null> {
    return await departmentRepository.createDepartment(department);
  }

  /**
   * Retrieves a single department by its unique identifier.
   *
   * @param departmentId - The unique identifier of the department to retrieve
   * @returns Promise resolving to the Department object if found, or null if not found
   *
   * @example
   * ```typescript
   * const dept = await departmentService.getDepartmentById('dept-123');
   * if (dept) {
   *   console.log(`Found department: ${dept.department_name}`);
   * }
   * ```
   */
  async getDepartmentById(departmentId: string): Promise<Department | null> {
    return await departmentRepository.getDepartmentById(departmentId);
  }

  /**
   * Retrieves all departments organized as a hierarchical tree structure.
   *
   * This method fetches all departments from the repository and transforms them
   * into a tree structure based on parent-child relationships. Only top-level
   * departments (level 1) are returned as root nodes, with their children and
   * descendants nested within them.
   *
   * The hierarchy is built using the `parent_department_id` field to establish
   * relationships and the `level` field to identify root departments.
   *
   * @returns Promise resolving to an array of root-level Department objects with
   *          nested children, or null if no departments exist
   *
   * @example
   * ```typescript
   * const hierarchy = await departmentService.getAllDepartments();
   * // Returns:
   * // [
   * //   {
   * //     department_id: 'dept-1',
   * //     department_name: 'Engineering',
   * //     level: 1,
   * //     children: [
   * //       {
   * //         department_id: 'dept-2',
   * //         department_name: 'Frontend',
   * //         level: 2,
   * //         parent_department_id: 'dept-1',
   * //         children: [...]
   * //       },
   * //       {
   * //         department_id: 'dept-3',
   * //         department_name: 'Backend',
   * //         level: 2,
   * //         parent_department_id: 'dept-1',
   * //         children: [...]
   * //       }
   * //     ]
   * //   }
   * // ]
   * ```
   *
   * @remarks
   * The tree structure is built using the following algorithm:
   * 1. All departments are mapped by their ID for O(1) lookup
   * 2. Each department is assigned an empty children array
   * 3. Departments are iterated to link children to their parents
   * 4. Only level 1 departments are returned as roots
   *
   * Time complexity: O(n) where n is the number of departments
   * Space complexity: O(n) for the department map and tree structure
   */
  async getAllDepartments(): Promise<Department[] | null> {
    const departments = await departmentRepository.getAllDepartments();
    if (!departments || departments.length === 0) return null;

    /**
     * Builds a hierarchical tree structure from a flat list of departments.
     *
     * This function transforms a flat array of departments into a tree structure
     * by establishing parent-child relationships. Each department that has a
     * `parent_department_id` is added to its parent's `children` array.
     *
     * @param departments - Flat array of all departments
     * @returns Array of root-level departments (level 1) with nested children
     *
     * @remarks
     * Implementation details:
     * - Uses a Map for O(1) department lookup by ID
     * - Extends each department with a `children` array property
     * - Filters final result to only include level 1 (root) departments
     * - Orphaned departments (with parent_department_id pointing to non-existent parent)
     *   will not appear in the result if they are not level 1
     *
     * @internal
     */
    const buildHierarchy = (departments: Department[]): Department[] => {
        // Create a map of all departments indexed by department_id for efficient lookup
        // Each department is enhanced with a children array to hold sub-departments
        const departmentMap = new Map<string, Department & { children: Department[] }>(
            departments.map(dept => [dept.department_id, { ...dept, children: [] }])
        );

        // Iterate through all departments to establish parent-child relationships
        departments.forEach(dept => {
            // If this department has a parent and the parent exists in our map
            if (dept.parent_department_id && departmentMap.has(dept.parent_department_id)) {
                const parent = departmentMap.get(dept.parent_department_id);
                if (parent) {
                    const childDept = departmentMap.get(dept.department_id);
                    if (childDept) {
                        // Add this department to its parent's children array
                        parent.children.push(childDept);
                    }
                }
            }
        });

        // Return only the root-level departments (level 1)
        // Child departments are already nested within their parents
        return Array.from(departmentMap.values()).filter(dept => dept.level === 1);
    };

    const hierarchicalDepartments = buildHierarchy(departments);

    return hierarchicalDepartments;
}

  /**
   * Updates an existing department's information.
   *
   * Allows partial updates to department fields. Only the fields provided
   * in the department object will be updated; other fields remain unchanged.
   *
   * @param departmentId - The unique identifier of the department to update
   * @param department - Partial department object containing fields to update
   * @returns Promise resolving to the updated Department object if successful,
   *          or null if update fails
   *
   * @example
   * ```typescript
   * // Update only the department name
   * const updated = await departmentService.updateDepartment('dept-123', {
   *   department_name: 'New Engineering Team'
   * });
   *
   * // Update multiple fields
   * const updated = await departmentService.updateDepartment('dept-123', {
   *   department_name: 'Engineering',
   *   manager_id: 'mgr-456',
   *   description: 'Software engineering department'
   * });
   * ```
   */
  async updateDepartment(departmentId: string, department: Partial<Department>): Promise<Department | null> {
    return await departmentRepository.updateDepartment(departmentId, department);
  }

  /**
   * Deletes a department from the system.
   *
   * @param departmentId - The unique identifier of the department to delete
   * @returns Promise resolving to true if deletion was successful, false otherwise
   *
   * @example
   * ```typescript
   * const success = await departmentService.deleteDepartment('dept-123');
   * if (success) {
   *   console.log('Department deleted successfully');
   * } else {
   *   console.log('Failed to delete department');
   * }
   * ```
   *
   * @remarks
   * Consider the implications of deleting a department that has child departments
   * or employees assigned to it. The behavior depends on database constraints.
   */
  async deleteDepartment(departmentId: string): Promise<boolean> {
    return await departmentRepository.deleteDepartment(departmentId);
  }
}
