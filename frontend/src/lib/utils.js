export const groupRequests = (requests) => {
    if (!Array.isArray(requests)) return [];
    // 1. Separate Parents and Children
    const parents = requests.filter(req => !req.parent_id);
    const childrenBlock = requests.filter(req => req.parent_id);

    // 2. Map children to their parents
    const grouped = parents.map(parent => {
        const children = childrenBlock
            .filter(child => child.parent_id === parent.id)
            .sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateB - dateA;
            }); // Newest child first

        return {
            ...parent,
            children: children
        };
    });

    // 3. Sort parents by created_at (Newest first)
    return grouped.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
    });
};
