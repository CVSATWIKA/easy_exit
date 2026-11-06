pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out Easy Exit project'
                checkout scm
            }
        }

        stage('Build Info') {
            steps {
                echo 'Easy Exit project checked out successfully'
                bat 'git --version'
                bat 'docker --version'
            }
        }
    }
}