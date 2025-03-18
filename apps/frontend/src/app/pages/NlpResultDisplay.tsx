import React from 'react';

interface DocumentViewerProps{
    content: string
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({content}) => {
    return(
        <div className = "document-viewer">
            <pre>{content}</pre>
        </div>
    );
};

export default DocumentViewer;