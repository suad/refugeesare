<?php

$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "refugeesare";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$url = $_POST['url'];
$vote = $_POST['vote'];

$sql = "SELECT * FROM votes WHERE url = '".$url."' ";
$result = $conn->query($sql);

if ($result->num_rows > 0) {

} else {
    $conn->query("INSERT INTO votes (url) VALUES ('".$url."')");
}


$conn->query("UPDATE votes SET ".$vote." = ".$vote." + 1 WHERE url = '".$url."' ");


$finalresult = $conn->query($sql);
$row = $finalresult->fetch_assoc();
print 'Thanks, Positive: '.$row["positive"].', Negative: '.$row["negative"].', Neutral: '.$row["neutral"];

$conn->close();

?>