pipeline {
    agent any

    environment {
        BACKEND_IMAGE = 'cvsatwika/easy-exit-backend'
        FRONTEND_IMAGE = 'cvsatwika/easy-exit-frontend'
        DOCKER_CREDENTIALS = 'dockerhub-creds'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out Easy Exit source code'
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                bat '''
                    echo Checking Git
                    git --version

                    echo Checking Docker
                    docker --version
                    docker info

                    echo Checking Kubernetes
                    kubectl version --client
                    kubectl config current-context
                    kubectl get nodes
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                bat '''
                    docker build ^
                    -t %BACKEND_IMAGE%:%BUILD_NUMBER% ^
                    -t %BACKEND_IMAGE%:latest ^
                    -f Dockerfile .
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat '''
                    docker build ^
                    --build-arg REACT_APP_API_URL=http://localhost:30081 ^
                    -t %FRONTEND_IMAGE%:%BUILD_NUMBER% ^
                    -t %FRONTEND_IMAGE%:latest ^
                    -f easy-exit-frontend/Dockerfile easy-exit-frontend
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIALS}",
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    bat '''
                        echo Logging in to Docker Hub
                        echo %DOCKERHUB_TOKEN% | docker login -u %DOCKERHUB_USER% --password-stdin
                    '''
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                bat '''
                    docker push %BACKEND_IMAGE%:%BUILD_NUMBER%
                    docker push %BACKEND_IMAGE%:latest

                    docker push %FRONTEND_IMAGE%:%BUILD_NUMBER%
                    docker push %FRONTEND_IMAGE%:latest
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                    echo Deploying Backend
                    kubectl set image deployment/backend-deployment backend=%BACKEND_IMAGE%:%BUILD_NUMBER%

                    echo Deploying Frontend
                    kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%BUILD_NUMBER%

                    echo Waiting for Backend rollout
                    kubectl rollout status deployment/backend-deployment --timeout=180s

                    echo Waiting for Frontend rollout
                    kubectl rollout status deployment/frontend-deployment --timeout=180s
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                bat '''
                    echo Kubernetes Deployments
                    kubectl get deployments

                    echo Kubernetes Pods
                    kubectl get pods -o wide

                    echo Kubernetes Services
                    kubectl get services
                '''
            }
        }
    }

    post {
        success {
            echo 'Easy Exit CI/CD Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the Jenkins console output for details.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
