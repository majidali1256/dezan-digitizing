<?php
// Secure Form Processing for Dezan Digitizing

// 1. Where emails should be sent
$to = "fdezan91@gmail.com";
$websiteDomain = "https://" . $_SERVER['HTTP_HOST']; 

function sanitizeInput($data) {
    return htmlspecialchars(stripslashes(trim($data)));
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Determine form type from subject or hidden fields
    $subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : "New Form Submission - Dezan";
    $redirectUrl = isset($_POST['redirect']) ? sanitizeInput($_POST['redirect']) : "index.html";
    
    // Start building the email HTML
    $email_content = "<h2>$subject</h2>";
    $email_content .= "<table cellpadding='10' border='1' style='border-collapse: collapse; border: 1px solid #e2e8f0; width: 100%; font-family: sans-serif;'>";
    
    // Add all POST fields (except system ones) to email
    $skip_fields = ['access_key', 'redirect', 'subject', 'from_name', 'MAX_FILE_SIZE'];
    
    foreach ($_POST as $key => $value) {
        if (!in_array($key, $skip_fields) && !empty($value)) {
            $formattedKey = ucwords(str_replace('_', ' ', $key));
            $formattedValue = nl2br(sanitizeInput($value));
            $email_content .= "<tr><td style='background-color:#f8fafc; font-weight:bold; width: 30%;'>$formattedKey</td><td>$formattedValue</td></tr>";
        }
    }
    $email_content .= "</table><br>";

    // 2. Handle File Uploads (Supports multiple files and large sizes safely)
    $uploadDir = __DIR__ . '/uploads/';
    // Create uploads folder if it doesn't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Process attachments
    if (isset($_FILES['attachment']) && count($_FILES['attachment']['name']) > 0) {
        $email_content .= "<h3>Attached Files:</h3><ul>";
        $filesUploaded = false;
        
        // Normalize array structure for multiple uploads
        $fileArray = [];
        if (is_array($_FILES['attachment']['name'])) {
            $fileCount = count($_FILES['attachment']['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                if ($_FILES['attachment']['error'][$i] === UPLOAD_ERR_OK) {
                    $fileArray[] = [
                        'name'     => $_FILES['attachment']['name'][$i],
                        'tmp_name' => $_FILES['attachment']['tmp_name'][$i]
                    ];
                }
            }
        } else {
            if ($_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
                $fileArray[] = [
                    'name'     => $_FILES['attachment']['name'],
                    'tmp_name' => $_FILES['attachment']['tmp_name']
                ];
            }
        }
        
        // Move files and add links to email
        foreach ($fileArray as $file) {
            // Create a safe, unique filename to prevent overwriting
            $safeName = preg_replace("/[^a-zA-Z0-9.-]/", "_", basename($file['name']));
            $uniqueFilename = time() . "_" . uniqid() . "_" . $safeName;
            $destination = $uploadDir . $uniqueFilename;
            
            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $filesUploaded = true;
                // Generate absolute URL for the email
                $fileUrl = $websiteDomain . "/uploads/" . $uniqueFilename;
                $email_content .= "<li><a href='$fileUrl'>$safeName</a></li>";
            }
        }
        
        if (!$filesUploaded) {
            $email_content .= "<li>No files were successfully uploaded.</li>";
        }
        $email_content .= "</ul>";
        $email_content .= "<p><em>Note: Files are securely saved on your GoDaddy server to prevent email size limits. Click the links above to download them.</em></p>";
    }

    // 3. Send the Email using native PHP mail()
    $headers  = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    
    // Set 'From' header based on whether an email was provided
    $replyTo = isset($_POST['email']) ? sanitizeInput($_POST['email']) : (isset($_POST['customer_email']) ? sanitizeInput($_POST['customer_email']) : $to);
    $headers .= "From: Dezan Website <noreply@" . str_replace('www.', '', $_SERVER['HTTP_HOST']) . ">" . "\r\n";
    $headers .= "Reply-To: $replyTo\r\n";

    $mailSent = @mail($to, $subject, $email_content, $headers);

    // 4. Redirect the user securely
    if ($mailSent) {
        // Successful message delivered
        header("Location: " . $redirectUrl);
        exit();
    } else {
        // Fallback error (hosting server mail configuration issue)
        echo "<h2>Error sending message.</h2><p>Please try again or email us directly at fdezan91@gmail.com.</p>";
    }
} else {
    // Not a POST request
    echo "Access denied.";
}
?>
