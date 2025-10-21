@echo off
setlocal enabledelayedexpansion

:start
cls
echo.        �X�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�[
echo.        �U                                �U
echo.        �U         �����ļ�����������      �U
echo.        �U                                �U
echo.        �^�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�a
echo.
echo.        [1] ���ǰ׺
echo.        [2] ��Ӻ�׺
echo.        [3] ������+���
echo.        [4] �˳�����
echo.
echo.        ������������������������������������������������������������������
echo.
set /p "choice=��ѡ����� (1-4): "
if "%choice%"=="1" goto :add_prefix
if "%choice%"=="2" goto :add_suffix
if "%choice%"=="3" goto :simple_numbering
if "%choice%"=="4" goto :exit_program

echo.
echo        [����] ��Ч��ѡ�����������룡
timeout /t 2 >nul
goto :start

:add_prefix
cls
echo.        �X�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�[
echo.        �U                                �U
echo.        �U         ���ǰ׺               �U
echo.        �U                                �U
echo.        �^�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�a
echo.
echo.        ������������������������������������������������������������������
echo.        ��������
echo.        - ǰ׺����ӵ�ԭ�ļ�������ǰ��
echo.        - ʾ����ǰ׺Ϊ"�羰_"���ļ�"1.jpg"����Ϊ"�羰_1.jpg"
echo.
set /p "prefix=������Ҫ��ӵ�ǰ׺: "
goto :get_file_type

:add_suffix
cls
echo.        �X�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�[
echo.        �U                                �U
echo.        �U         ��Ӻ�׺               �U
echo.        �U                                �U
echo.        �^�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�a
echo.
echo.        ������������������������������������������������������������������
echo.        ��������
echo.        - ��׺����ӵ�ԭ�ļ�������չ��֮��
echo.        - ʾ������׺Ϊ"_2023"���ļ�"1.jpg"����Ϊ"1_2023.jpg"
echo.
set /p "suffix=������Ҫ��ӵĺ�׺: "
goto :get_file_type

:simple_numbering
cls
echo.        �X�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�[
echo.        �U                                �U
echo.        �U       ������+���������         �U
echo.        �U                                �U
echo.        �^�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�a
echo.
echo.        ������������������������������������������������������������������
echo.        ��ʽʾ����
echo.        - ����"��Ƭ"���ļ���������Ϊ����Ƭ1.jpg, ��Ƭ2.jpg...
echo.        - ����"�ĵ�_"���ļ���������Ϊ���ĵ�_1.jpg, �ĵ�_2.jpg...
echo.
set /p "main_name=������������: "
echo.
set "start_num=1"
set /p "start_num=��������ʼ���(Ĭ��1): "
if not defined start_num set start_num=1
set /a count=start_num-1
goto :get_file_type

:get_file_type
echo.
set /p "ext=�������ļ�����(�� txt,jpg, �� * ��ʾ�����ļ�): "
if "%ext%"=="" set "ext=*"
if not "%ext:~0,1%"=="." if "%ext%" neq "*" set "ext=.%ext%"
set "ext=%ext:.=.%"
set "ext=%ext: =%"

echo.
echo.        ������������������������������������������������������������������
echo.
if "%choice%"=="1" echo        Ҫ��ӵ�ǰ׺: "%prefix%"
if "%choice%"=="2" echo        Ҫ��ӵĺ�׺: "%suffix%"
if "%choice%"=="3" (
    echo        ������: "%main_name%"
    echo        ��ʼ���: %start_num%
)
echo.
echo.        ������������������������������������������������������������������
echo.

set /p "confirm=ȷ�Ͽ�ʼ����? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo.
    echo        ������ȡ��
    timeout /t 2 >nul
    goto :start
)

set success=0
set failed=0

for /f "delims=" %%f in ('dir /b "*%ext%" ^| findstr /v /i "%~nx0"') do (
    set /a count+=1
    set "fileext=%%~xf"
    set "fullname=%%f"
    
    if "%choice%"=="1" (
        set "newname=%prefix%%%f"
    ) else if "%choice%"=="2" (
        set "newname=%%~nf%suffix%%%xf"
    ) else if "%choice%"=="3" (
        set "newname=%main_name%!count!!fileext!"
    )
    
    if not "!fullname!"=="!newname!" (
        ren "!fullname!" "!newname!" >nul 2>&1
        if !errorlevel! equ 0 (
            echo        [�ɹ�] ��������: "!fullname!" �� "!newname!"
            set /a success+=1
        ) else (
            echo        [ʧ��] ������ʧ��: "!fullname!"
            set /a failed+=1
        )
    ) else (
        echo        [��ʾ] ����δ�仯: "!fullname!"
    )
)

echo.
echo.        ������������������������������������������������������������������
echo.
echo        �ܼƴ��� %count% ���ļ�
echo        �ɹ�������: %success% ��
echo        ������ʧ��: %failed% ��
echo.
echo.        ������������������������������������������������������������������
echo.

set /p "again=�Ƿ��������? (Y/N): "
if /i "%again%"=="Y" goto :start

:exit_program
cls
echo.        �X�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�[
echo.        �U                                �U
echo.        �U         �����ļ�����������      �U
echo.        �U                                �U
echo.        �^�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�a
echo.
echo.        ��лʹ�ã�������3����˳�...
echo.
echo.        ������������������������������������������������������������������
timeout /t 3 >nul
endlocal
exit /b